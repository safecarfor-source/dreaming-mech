import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GdService } from './gd.service';
import { IncentiveJwtGuard } from '../guards/incentive-auth.guard';

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

  @Get('vehicles/:code/repairs')
  getVehicleRepairs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Param('code') code: string,
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
    // 기본값: 이번 달 1일 ~ 오늘
    const now = new Date();
    const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const defaultEnd = now.toISOString().slice(0, 10);
    return this.gdService.getCashLedger(
      startDate || defaultStart,
      endDate || defaultEnd,
    );
  }

  @Get('sync-status')
  getSyncStatus() {
    return this.gdService.getSyncStatus();
  }
}
