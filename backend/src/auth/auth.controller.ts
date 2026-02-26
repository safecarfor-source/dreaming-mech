import { Controller, Post, Body, Get, UseGuards, Request, Response, UsePipes, Query, Req } from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
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
    return { message: 'Logged out successfully' };
  }

  // ── 네이버 소셜 로그인 ──

  @Get('naver')
  naverLogin(
    @Query('ref') ref: string | undefined,
    @Response() res: ExpressResponse,
  ) {
    // 레퍼럴 코드를 쿠키에 임시 저장 (OAuth 리다이렉트 동안 유지)
    if (ref) {
      res.cookie('ref_code', ref, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000, // 10분
        path: '/',
      });
    }
    const url = this.authService.getNaverLoginUrl();
    res.redirect(url);
  }

  @Get('naver/callback')
  async naverCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      const refCode = req.cookies?.ref_code;
      const result = await this.authService.handleNaverCallback(code, state, refCode);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // 레퍼럴 쿠키 정리
      res.clearCookie('ref_code', { path: '/' });

      res.cookie('owner_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.redirect(`${frontendUrl}/owner/callback?status=${result.owner.status}`);
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/owner/login?error=naver_failed`);
    }
  }

  // ── 카카오 소셜 로그인 ──

  @Get('kakao')
  kakaoLogin(
    @Query('ref') ref: string | undefined,
    @Response() res: ExpressResponse,
  ) {
    // 레퍼럴 코드를 쿠키에 임시 저장 (OAuth 리다이렉트 동안 유지)
    if (ref) {
      res.cookie('ref_code', ref, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000, // 10분
        path: '/',
      });
    }
    const url = this.authService.getKakaoLoginUrl();
    res.redirect(url);
  }

  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Req() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    try {
      const refCode = req.cookies?.ref_code;
      const result = await this.authService.handleKakaoCallback(code, refCode);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // 레퍼럴 쿠키 정리
      res.clearCookie('ref_code', { path: '/' });

      res.cookie('owner_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.redirect(`${frontendUrl}/owner/callback?status=${result.owner.status}`);
    } catch {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/owner/login?error=kakao_failed`);
    }
  }
}
