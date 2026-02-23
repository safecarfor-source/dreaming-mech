import { Controller, Post, Body, Get, UseGuards, Request, Response, UsePipes, Query } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { LoginSchema, type LoginDto } from '../mechanic/schemas/mechanic.schema';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ── 관리자 로그인 ──

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    res.cookie('admin_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      admin: result.admin,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    if (req.user.role === 'owner') {
      return this.authService.getOwnerProfile(req.user.sub);
    }
    return this.authService.getProfile(req.user.sub);
  }

  @Post('logout')
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('admin_token', { path: '/' });
    res.clearCookie('owner_token', { path: '/' });
    res.clearCookie('customer_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  // ── 카카오 소셜 로그인 (정비사) ──

  @Get('kakao')
  kakaoLogin(@Response() res: ExpressResponse) {
    const url = this.authService.getKakaoLoginUrl();
    res.redirect(url);
  }

  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Response() res: ExpressResponse,
  ) {
    try {
      const result = await this.authService.handleKakaoCallback(code);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      res.cookie('owner_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.redirect(`${frontendUrl}/owner/callback?status=${result.owner.status}`);
    } catch (error: any) {
      console.error('카카오 로그인 에러:', error?.response?.data || error?.message || error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/owner/login?error=kakao_failed`);
    }
  }

  // ── 카카오 소셜 로그인 (고객) ──

  @Get('kakao/customer')
  kakaoCustomerLogin(@Response() res: ExpressResponse) {
    const url = this.authService.getKakaoCustomerLoginUrl();
    res.redirect(url);
  }

  @Get('kakao/customer/callback')
  async kakaoCustomerCallback(
    @Query('code') code: string,
    @Query('phone') phone: string,
    @Response() res: ExpressResponse,
  ) {
    try {
      const result = await this.authService.handleKakaoCustomerCallback(code, phone || '');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      res.cookie('customer_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.redirect(`${frontendUrl}/inquiry/callback?success=true`);
    } catch (error: any) {
      console.error('고객 카카오 로그인 에러:', error?.response?.data || error?.message || error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/inquiry?error=kakao_failed`);
    }
  }
}
