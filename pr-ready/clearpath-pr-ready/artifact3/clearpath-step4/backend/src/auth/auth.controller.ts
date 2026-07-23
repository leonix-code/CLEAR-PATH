import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

const REFRESH_COOKIE = 'clearpath_refresh';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, { ip: req.ip, ua: req.headers['user-agent'] });
  }

  @Post('login') @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, { ip: req.ip, ua: req.headers['user-agent'] });
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
    const { refreshToken: _refreshToken, ...publicResult } = result;
    return publicResult;
  }

  @Post('refresh') @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return this.auth.refreshToken('missing-token');
    const result = await this.auth.refreshToken(token, { ip: req.ip, ua: req.headers['user-agent'] });
    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
    const { refreshToken: _refreshToken, ...publicResult } = result;
    return publicResult;
  }

  @Post('logout') @HttpCode(HttpStatus.OK) @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT-auth')
  async logout(@GetUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
    return this.auth.logout(userId);
  }

  @Get('profile') @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT-auth')
  profile(@GetUser('id') userId: string) { return this.auth.getProfile(userId); }

  @Post('forgot-password') @HttpCode(HttpStatus.OK)
  forgot(@Body() dto: ForgotPasswordDto) { return this.auth.forgotPassword(dto.email); }

  @Post('reset-password') @HttpCode(HttpStatus.OK)
  reset(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto.token, dto.password); }
}
