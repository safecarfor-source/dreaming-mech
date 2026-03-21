import { Controller, Post, Put, Get, Body, UseGuards, Request, UseFilters } from '@nestjs/common';
import { IncentiveAuthService } from './incentive-auth.service';
import { IncentiveJwtGuard } from '../guards/incentive-auth.guard';
import { LoginDto } from '../dto/login.dto';
import { IncentiveExceptionFilter } from '../filters/incentive-exception.filter';

@Controller('incentive/auth')
@UseFilters(IncentiveExceptionFilter)
export class IncentiveAuthController {
  constructor(private authService: IncentiveAuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.loginId, body.password);
  }

  @Get('me')
  @UseGuards(IncentiveJwtGuard)
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  @Put('change-password')
  @UseGuards(IncentiveJwtGuard)
  changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }
}
