import {
  Controller, Post, Get, Body, UseGuards,
  UnauthorizedException, Headers,
} from '@nestjs/common';
import { AutoCalcService } from './auto-calc.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/auto-calc')
export class AutoCalcController {
  constructor(private autoCalcService: AutoCalcService) {}

  /**
   * gd_sync_server.py에서 동기화 완료 후 호출
   * 시크릿 토큰으로 인증 (서버 내부 전용)
   */
  @Post('trigger')
  async trigger(
    @Body('month') month?: string,
    @Headers('x-auto-calc-secret') secret?: string,
  ) {
    const expected = process.env.AUTO_CALC_SECRET;
    if (expected && secret !== expected) {
      throw new UnauthorizedException('잘못된 시크릿');
    }
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
  @UseGuards(IncentiveJwtGuard)
  async status() {
    return this.autoCalcService.getStatus();
  }
}
