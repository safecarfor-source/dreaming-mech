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

  @Get('sync-status')
  getSyncStatus() {
    return this.gdService.getSyncStatus();
  }
}
