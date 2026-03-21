import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GdService } from './gd.service';
import { IncentiveJwtGuard } from '../guards/incentive-auth.guard';
import { todayKST } from '../utils/kst';

@Controller('incentive/gd')
@UseGuards(IncentiveJwtGuard)
export class GdController {
  constructor(private gdService: GdService) {}

  @Get('vehicles')
  searchVehicles(
    @Query('q') q: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.gdService.searchVehicles(q, parseInt(page), parseInt(limit));
  }

  // 기존 path parameter 방식 (하위 호환 유지)
  @Get('vehicles/:code/repairs')
  getVehicleRepairsByPath(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Param('code') code: string,
  ) {
    return this.gdService.getVehicleRepairs(code, parseInt(page), parseInt(limit));
  }

  // 슬래시 등 특수문자 포함 차량코드 대응 — query parameter 방식
  @Get('vehicle-repairs')
  getVehicleRepairs(
    @Query('code') code: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.gdService.getVehicleRepairs(code, parseInt(page), parseInt(limit));
  }

  @Get('products')
  searchProducts(
    @Query('q') q: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.gdService.searchProducts(q, parseInt(page), parseInt(limit));
  }

  @Get('customers')
  searchCustomers(
    @Query('q') q: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.gdService.searchCustomers(q, parseInt(page), parseInt(limit));
  }

  // 시재관리 (현금 출납부) - 현금수금 기반 입출금 현황
  // GET /incentive/gd/cash-ledger?startDate=2026-03-01&endDate=2026-03-31
  @Get('cash-ledger')
  getCashLedger(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    // 기본값: 이번 달 1일 ~ 오늘 (KST 기준)
    const today = todayKST();
    const defaultStart = today.slice(0, 7) + '-01';
    const defaultEnd = today;
    return this.gdService.getCashLedger(
      startDate || defaultStart,
      endDate || defaultEnd,
    );
  }

  @Get('daily-revenue')
  getDailyRevenue(@Query('date') date?: string) {
    return this.gdService.getDailyRevenue(date || todayKST());
  }

  @Get('sync-status')
  getSyncStatus() {
    return this.gdService.getSyncStatus();
  }
}
