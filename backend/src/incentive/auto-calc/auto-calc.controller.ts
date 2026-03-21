import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AutoCalcService } from './auto-calc.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/auto-calc')
@UseGuards(IncentiveJwtGuard)
export class AutoCalcController {
  constructor(private autoCalcService: AutoCalcService) {}

  /**
   * gd_sync_server.py에서 동기화 완료 후 호출
   * JWT 인증 + admin 권한 필요
   */
  @Post('trigger')
  @UseGuards(IncentiveJwtGuard, RolesGuard)
  @Roles('admin')
  async trigger(@Body('month') month?: string) {
    return this.autoCalcService.calculateMonth(month);
  }

  /** 관리자 수동 재계산 */
  @Post('manual')
  @UseGuards(IncentiveJwtGuard, RolesGuard)
  @Roles('admin')
  async manual(@Body('month') month?: string) {
    return this.autoCalcService.calculateMonth(month);
  }

  /** 최근 자동계산 이력 조회 */
  @Get('status')
  async status() {
    return this.autoCalcService.getStatus();
  }
}
