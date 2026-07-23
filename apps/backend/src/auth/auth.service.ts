import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── REGISTER ──
  async register(dto: { email: string; password: string; firstName: string; lastName: string; role: string; phone?: string }, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role as any,
        isActive: true,
        isVerified: false,
        authProvider: 'LOCAL' as any,
      },
    });

    // Create email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Audit log
    await this.logAudit(user.id, 'CREATE', 'User', user.id, { role: dto.role }, null, ip, userAgent);

    const tokens = await this.generateTokens(user.id, user.email, user.role, ip, userAgent);

    this.logger.log(`User registered: ${user.email}`);

    return {
      message: 'Registration successful. Please verify your email.',
      user: this.sanitizeUser(user),
      verificationToken,
      ...tokens,
    };
  }

  // ── LOGIN ──
  async login(dto: { email: string; password: string; rememberMe?: boolean }, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) {
      await this.logAudit(null, 'LOGIN_FAILED', 'User', dto.email, { email: dto.email }, null, ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) throw new UnauthorizedException('Account is deactivated');

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      await this.logAudit(user.id, 'LOGIN_FAILED', 'User', user.id, null, null, ip, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, ip, userAgent, dto.rememberMe);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        loginCount: { increment: 1 },
      },
    });

    await this.logAudit(user.id, 'LOGIN', 'User', user.id, null, null, ip, userAgent);
    this.logger.log(`User logged in: ${user.email}`);

    return {
      message: 'Login successful',
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // ── MAGIC LINK ──
  async sendMagicLink(email: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a magic link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.magicLink.create({
      data: { email, token, expiresAt },
    });

    await this.logAudit(user.id, 'MAGIC_LINK_SENT', 'User', user.id, { email }, null, ip, userAgent);
    this.logger.log(`Magic link sent to: ${email}`);

    // In production, send email with magic link
    return { message: 'If the email exists, a magic link has been sent', token };
  }

  async verifyMagicLink(token: string, ip?: string, userAgent?: string) {
    const magicLink = await this.prisma.magicLink.findUnique({ where: { token } });
    if (!magicLink || magicLink.usedAt || new Date() > magicLink.expiresAt) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { email: magicLink.email } });
    const tokens = await this.generateTokens(user.id, user.email, user.role, ip, userAgent);

    await this.logAudit(user.id, 'LOGIN', 'User', user.id, { method: 'magic_link' }, null, ip, userAgent);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  // ── REFRESH TOKEN ──
  async refreshToken(refreshTokenValue: string, ip?: string, userAgent?: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (!stored || stored.isRevoked || new Date() > stored.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(stored.user.id, stored.user.email, stored.user.role, ip, userAgent);
    return tokens;
  }

  // ── LOGOUT ──
  async logout(userId: string, refreshTokenValue?: string) {
    if (refreshTokenValue) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshTokenValue },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    }

    await this.logAudit(userId, 'LOGOUT', 'User', userId, null, null);
    return { message: 'Logged out successfully' };
  }

  // ── EMAIL VERIFICATION ──
  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification || verification.verifiedAt || new Date() > verification.expiresAt) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { isVerified: true, emailVerifiedAt: new Date() },
    });

    await this.logAudit(verification.userId, 'EMAIL_VERIFY', 'User', verification.userId, null, null);
    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.isVerified) throw new BadRequestException('Email already verified');

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.emailVerification.create({
      data: {
        userId,
        email: user.email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { message: 'Verification email resent', token };
  }

  // ── PASSWORD RESET ──
  async forgotPassword(email: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const always = { message: 'If the email exists, a reset link has been sent' };
    if (!user) return always;

    // Invalidate old tokens
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await this.logAudit(user.id, 'PASSWORD_RESET_REQUEST', 'User', user.id, { email }, null, ip, userAgent);
    this.logger.log(`Password reset requested for: ${email}`);

    // In production, send email with reset link
    return { message: 'If the email exists, a reset link has been sent', resetToken: token };
  }

  async resetPassword(token: string, newPassword: string, ip?: string, userAgent?: string) {
    const reset = await this.prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.usedAt || new Date() > reset.expiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      }),
    ]);

    // Revoke all existing refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: reset.userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await this.logAudit(reset.userId, 'PASSWORD_RESET', 'User', reset.userId, null, null, ip, userAgent);
    this.logger.log(`Password reset completed for user: ${reset.userId}`);

    return { message: 'Password reset successfully' };
  }

  // ── CHANGE PASSWORD ──
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password!);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // ── PROFILE ──
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: { include: { department: true, course: true } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; phone?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return this.sanitizeUser(user);
  }

  // ── VALIDATE USER (for JWT strategy) ──
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return null;
    return user;
  }

  // ── OAUTH ──
  async handleOAuthLogin(provider: string, profile: { email: string; firstName: string; lastName: string; id: string }, ip?: string, userAgent?: string) {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: 'STUDENT',
          isActive: true,
          isVerified: true,
          authProvider: provider.toUpperCase() as any,
          providerId: profile.id,
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, ip, userAgent);
    await this.logAudit(user.id, 'LOGIN', 'User', user.id, { method: `${provider}_oauth` }, null, ip, userAgent);

    return { ...tokens, user: this.sanitizeUser(user) };
  }

  // ── PRIVATE HELPERS ──

  private async generateTokens(userId: string, email: string, role: string, ip?: string, userAgent?: string, rememberMe?: boolean) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshTokenValue = crypto.randomBytes(48).toString('hex');
    const refreshExpiresIn = rememberMe ? '30d' : this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue, expiresAt };
  }

  private sanitizeUser(user: any) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private async logAudit(userId: string | null, action: string, entity: string, entityId: string | null, metadata?: any, details?: any, ip?: string, userAgent?: string) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId || undefined,
          action: action as any,
          entity,
          entityId: entityId || undefined,
          metadata: metadata || undefined,
          ipAddress: ip,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to create audit log: ${error.message}`);
    }
  }
}
