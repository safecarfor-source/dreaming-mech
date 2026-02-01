import { Controller, Post, Body, Get, UseGuards, Request, Response, UsePipes } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { LoginSchema, type LoginDto } from '../mechanic/schemas/mechanic.schema';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    // Set HttpOnly cookie for security
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return admin info without token (token is in cookie)
    return {
      admin: result.admin,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Post('logout')
  async logout(@Response({ passthrough: true }) res: ExpressResponse) {
    // Clear the cookie
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }
}
