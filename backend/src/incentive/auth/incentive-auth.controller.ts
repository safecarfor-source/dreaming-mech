import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { IncentiveAuthService } from './incentive-auth.service';
import { IncentiveJwtGuard } from '../guards/incentive-auth.guard';

@Controller('incentive/auth')
export class IncentiveAuthController {
  constructor(private authService: IncentiveAuthService) {}

  @Post('login')
  login(@Body() body: { loginId: string; password: string }) {
    return this.authService.login(body.loginId, body.password);
  }

  @Get('me')
  @UseGuards(IncentiveJwtGuard)
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.userId);
  }
}
