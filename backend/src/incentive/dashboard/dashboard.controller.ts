import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive')
@UseGuards(IncentiveJwtGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // GET /incentive/dashboard/summary/:year/:month
  // 종합 대시보드 데이터 조회
  @Get('dashboard/summary/:year/:month')
  getSummary(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.dashboardService.getSummary(year, month);
  }

  // GET /incentive/cashflow/:year/:month
  // 현금흐름 데이터 조회
  @Get('cashflow/:year/:month')
  getCashFlow(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.dashboardService.getCashFlow(year, month);
  }

  // PUT /incentive/cashflow/:year/:month
  // 현금흐름 데이터 저장 (admin 전용)
  @Put('cashflow/:year/:month')
  @UseGuards(RolesGuard)
  @Roles('admin')
  saveCashFlow(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body() body: { cash?: number; investment?: number; inventory?: number },
  ) {
    return this.dashboardService.saveCashFlow(year, month, body);
  }

  // GET /incentive/opening-cash/:year/:month
  // 월초 이월시재 조회
  @Get('opening-cash/:year/:month')
  getOpeningCash(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.dashboardService.getOpeningCash(year, month);
  }

  // PUT /incentive/opening-cash/:year/:month
  // 월초 이월시재 설정 (admin 전용)
  @Put('opening-cash/:year/:month')
  @UseGuards(RolesGuard)
  @Roles('admin')
  setOpeningCash(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body() body: { openingCash: number },
  ) {
    return this.dashboardService.setOpeningCash(year, month, body.openingCash);
  }
}
