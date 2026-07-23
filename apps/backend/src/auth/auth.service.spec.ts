import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrisma, mockJwtService, mockConfigService } from '../testing/mocks/prisma.mock';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    password: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT',
    isActive: true,
    isVerified: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Register
  describe('register', () => {
    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({ token: 'refresh-token' });

      const result = await authService.register({
        email: 'test@test.com', password: 'Password123!', firstName: 'Test', lastName: 'User', role: 'STUDENT',
      });

      expect(result.message).toBe('Registration successful');
      expect(result.user).toBeDefined();
      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBe('mock-access-token');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        authService.register({ email: 'test@test.com', password: 'Pw123!', firstName: 'T', lastName: 'U', role: 'STUDENT' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password with 12 salt rounds', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({ token: 'rt' });
      const spy = jest.spyOn(bcrypt, 'hash');
      await authService.register({ email: 'new@t.com', password: 'Sp1!', firstName: 'N', lastName: 'U', role: 'STUDENT' });
      expect(spy).toHaveBeenCalledWith('Sp1!', 12);
    });
  });

  // Login
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({ token: 'rt' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.login({ email: 'test@test.com', password: 'correct' });
      expect(result.message).toBe('Login successful');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login({ email: 'no@test.com', password: 'x' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for deactivated account', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      await expect(authService.login({ email: 'test@test.com', password: 'x' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(authService.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  // Refresh Token
  describe('refreshToken', () => {
    const mockRT = { id: 'rt-1', token: 'valid', userId: 'u1', expiresAt: new Date(Date.now() + 86400000), isRevoked: false, revokedAt: null, user: mockUser };

    it('should refresh tokens successfully', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(mockRT);
      prisma.refreshToken.update.mockResolvedValue({ ...mockRT, isRevoked: true });
      prisma.refreshToken.create.mockResolvedValue({ token: 'new-rt' });
      const result = await authService.refreshToken('valid');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw for revoked token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({ ...mockRT, isRevoked: true });
      await expect(authService.refreshToken('revoked')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({ ...mockRT, expiresAt: new Date(Date.now() - 1000) });
      await expect(authService.refreshToken('expired')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for non-existent token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(authService.refreshToken('fake')).rejects.toThrow(UnauthorizedException);
    });
  });

  // Logout
  describe('logout', () => {
    it('should revoke all user refresh tokens', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      const result = await authService.logout('user-1');
      expect(result.message).toBe('Logged out successfully');
    });
  });

  // Profile
  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, student: { department: { name: 'CS' }, course: { name: 'BSc CS' } } });
      const result = await authService.getProfile('user-1');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.getProfile('no')).rejects.toThrow(UnauthorizedException);
    });
  });

  // Change Password
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash' as never);
      prisma.user.update.mockResolvedValue(mockUser);
      const result = await authService.changePassword('user-1', 'old', 'new');
      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw when current password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(authService.changePassword('u1', 'wrong', 'new')).rejects.toThrow(BadRequestException);
    });

    it('should throw when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.changePassword('no', 'old', 'new')).rejects.toThrow(UnauthorizedException);
    });
  });

  // Validate User
  describe('validateUser', () => {
    it('should return user when active', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await authService.validateUser('u1');
      expect(result).toEqual(mockUser);
    });

    it('should return null for deactivated user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      const result = await authService.validateUser('u1');
      expect(result).toBeNull();
    });
  });

  // Forgot Password
  describe('forgotPassword', () => {
    it('should send reset token for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await authService.forgotPassword('test@test.com') as { message: string; resetToken: string };
      expect(result.message).toContain('reset link');
      expect(result.resetToken).toBeDefined();
    });

    it('should return same message for non-existent user (security)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await authService.forgotPassword('no@test.com') as { message: string; resetToken?: string };
      expect(result.message).toContain('reset link');
      expect(result.resetToken).toBeUndefined();
    });
  });

  // Reset Password
  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const mockReset = {
        id: 'reset-1',
        userId: 'user-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
      };
      prisma.passwordReset.findUnique.mockResolvedValue(mockReset);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hash' as never);

      const result = await authService.resetPassword('valid-token', 'NewPw123!');
      expect(result.message).toBe('Password reset successfully');
    });

    it('should throw for expired token', async () => {
      prisma.passwordReset.findUnique.mockResolvedValue({
        id: 'r1', userId: 'u1', token: 'expired', expiresAt: new Date(Date.now() - 1000), usedAt: null,
      });
      await expect(authService.resetPassword('expired', 'new')).rejects.toThrow(BadRequestException);
    });
  });

  // OAuth
  describe('handleOAuthLogin', () => {
    it('should create new user on first OAuth login', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({ token: 'rt' });

      const result = await authService.handleOAuthLogin('google', {
        email: 'oauth@test.com', firstName: 'O', lastName: 'Auth', id: 'google-1',
      });
      expect(result.accessToken).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should login existing OAuth user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, authProvider: 'GOOGLE', oauthId: 'google-1' });
      prisma.refreshToken.create.mockResolvedValue({ token: 'rt' });

      const result = await authService.handleOAuthLogin('google', {
        email: 'test@test.com', firstName: 'T', lastName: 'U', id: 'google-1',
      });
      expect(result.accessToken).toBeDefined();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});
