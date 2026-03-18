import { Controller, Post, Body, Get, UseGuards, Request, Response, UsePipes, Query, Patch } from '@nestjs/common';
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
    if (req.user.role === 'user') {
      return this.authService.getUserProfile(req.user.sub);
    }
    return this.authService.getProfile(req.user.sub);
  }

  // ── 사용자 추적 코드 연결 (로그인 후 최초 유입 경로 저장) ──
  @UseGuards(JwtAuthGuard)
  @Patch('tracking')
  async updateUserTracking(
    @Request() req,
    @Body() body: { trackingCode: string },
  ) {
    const result = await this.authService.updateUserTracking(
      req.user.sub,
      body.trackingCode,
    );
    return {
      success: true,
      data: result,
    };
  }

  // ── 사용자 프로필 업데이트 ──
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateUserProfile(
    @Request() req,
    @Body() body: { phone?: string; businessName?: string; nickname?: string },
  ) {
    return this.authService.updateUserProfile(req.user.sub, body);
  }

  @Post('logout')
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('admin_token', { path: '/' });
    res.clearCookie('user_token', { path: '/' });
    // 하위 호환: 기존 쿠키도 클리어
    res.clearCookie('owner_token', { path: '/' });
    res.clearCookie('customer_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  // ── 카카오 소셜 로그인 ──

  @Get('kakao')
  kakaoLogin(
    @Query('from') from: string,
    @Response() res: ExpressResponse,
  ) {
    const url = this.authService.getKakaoLoginUrl(from);
    res.redirect(url);
  }

  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Response() res: ExpressResponse,
  ) {
    try {
      const result = await this.authService.handleKakaoCallback(code);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      res.cookie('user_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      // state 파라미터에서 from 값 복원하여 프론트로 전달
      const fromParam = state ? `&from=${state}` : '';
      res.redirect(`${frontendUrl}/auth/callback?businessStatus=${result.user.businessStatus}${fromParam}`);
    } catch (error: any) {
      console.error('카카오 로그인 에러:', error?.response?.data || error?.message || error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=kakao_failed`);
    }
  }
}
