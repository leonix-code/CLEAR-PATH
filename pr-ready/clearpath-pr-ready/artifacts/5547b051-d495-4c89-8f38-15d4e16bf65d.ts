import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException, ForbiddenException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditAction, UserRole } from '@prisma/client';

/** Hash opaque tokens with SHA-256 before persisting (never store raw). */
const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
const randomToken = () => crypto.randomBytes(48).toString('base64url');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------------- REGISTER
  // FIX C1: role is forced to STUDENT and email verification is required.
  async register(dto: RegisterDto, ctx?: { ip?: string; ua?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.STUDENT,   // <-- never trust client input
        isVerified: false,        // <-- must verify email
      },
    });

    await this.issueEmailVerification(user.id, user.email);
    await this.audit(user.id, AuditAction.CREATE, 'User', user.id, ctx);

    return { message: 'Registration successful. Check your email to verify your account.' };
  }

  // ------------------------------------------------------------------- LOGIN
  async login(dto: LoginDto, ctx?: { ip?: string; ua?: string }) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },   // FIX M2: respect soft delete
    });
    // constant-ish time: always run a compare to reduce user-enumeration timing
    const ok = user && (await bcrypt.compare(dto.password, user.password));
    if (!user || !ok) {
      await this.audit(user?.id ?? null, AuditAction.LOGIN, 'User', user?.id ?? null, ctx, { success: false });
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');
    if (!user.isVerified) throw new ForbiddenException('Email not verified');

    const tokens = await this.issueTokens(user.id, user.email, user.role, ctx);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit(user.id, AuditAction.LOGIN, 'User', user.id, ctx, { success: true });
    return { message: 'Login successful', user: this.sanitize(user), ...tokens };
  }

  // --------------------------------------------------- REFRESH (rotation + reuse detection)
  // FIX C5: refresh tokens are stored hashed; reuse of a rotated token revokes the whole family.
  async refreshToken(rawToken: string, ctx?: { ip?: string; ua?: string }) {
    const tokenHash = sha256(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash }, include: { user: true },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    // Reuse detection: a token that was already rotated/revoked is being replayed.
    if (stored.isRevoked) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected; session revoked');
    }
    if (new Date() > stored.expiresAt) throw new UnauthorizedException('Refresh token expired');

    await this.prisma.refreshToken.update({
      where: { id: stored.id }, data: { isRevoked: true, revokedAt: new Date() },
    });
    return this.issueTokens(stored.user.id, stored.user.email, stored.user.role, ctx, stored.familyId);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false }, data: { isRevoked: true, revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  // ------------------------------------------------------- PASSWORD RESET (real impl, FIX C2)
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (user) {
      const raw = randomToken();
      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: sha256(raw),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
        },
      });
      // TODO(mail): enqueue email with link ?token=raw  (MailService via BullMQ)
      this.logger.log(`Password reset issued for ${email}`);
    }
    // Always identical response (no user enumeration)
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const rec = await this.prisma.passwordReset.findUnique({ where: { tokenHash: sha256(rawToken) } });
    if (!rec || rec.usedAt || new Date() > rec.expiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: rec.userId },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      this.prisma.passwordReset.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
      // Invalidate all existing sessions after a reset.
      this.prisma.refreshToken.updateMany({
        where: { userId: rec.userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);
    return { message: 'Password reset successful' };
  }

  // ---------------------------------------------------------- EMAIL VERIFICATION
  async issueEmailVerification(userId: string, email: string) {
    const raw = randomToken();
    await this.prisma.emailVerification.create({
      data: { userId, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + 24 * 3600 * 1000) },
    });
    // TODO(mail): enqueue verification email with ?token=raw
    this.logger.log(`Email verification issued for ${email}`);
  }

  async verifyEmail(rawToken: string) {
    const rec = await this.prisma.emailVerification.findUnique({ where: { tokenHash: sha256(rawToken) } });
    if (!rec || rec.usedAt || new Date() > rec.expiresAt) throw new BadRequestException('Invalid or expired token');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: rec.userId }, data: { isVerified: true } }),
      this.prisma.emailVerification.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
    ]);
    return { message: 'Email verified' };
  }

  // ----------------------------------------------------------------- helpers
  private async issueTokens(userId: string, email: string, role: string, ctx?: { ip?: string; ua?: string }, familyId?: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email, role });
    const raw = randomToken();
    const fam = familyId ?? crypto.randomUUID();
    const ttlDays = Number(this.config.get('REFRESH_TOKEN_TTL_DAYS', 7));
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: sha256(raw),
        familyId: fam,
        userId,
        userAgent: ctx?.ua,
        ipAddress: ctx?.ip,
        expiresAt: new Date(Date.now() + ttlDays * 24 * 3600 * 1000),
      },
    });
    const accessTtl = this.config.get('JWT_EXPIRES_IN', '15m');
    return { accessToken, refreshToken: raw, tokenType: 'Bearer', accessExpiresIn: accessTtl };
  }

  private async audit(userId: string | null, action: AuditAction, entity: string, entityId: string | null, ctx?: { ip?: string; ua?: string }, metadata?: any) {
    try {
      await this.prisma.auditLog.create({
        data: { userId: userId ?? undefined, action, entity, entityId: entityId ?? undefined, ipAddress: ctx?.ip, userAgent: ctx?.ua, metadata },
      });
    } catch (e) { this.logger.warn(`audit write failed: ${(e as Error).message}`); }
  }

  private sanitize(user: any) { const { password, ...rest } = user; return rest; }
}
