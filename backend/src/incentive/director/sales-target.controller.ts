import { Controller, Get, Put, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { SalesTargetService } from './sales-target.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/sales-target')
@UseGuards(IncentiveJwtGuard)
export class SalesTargetController {
  constructor(private salesTargetService: SalesTargetService) {}

  @Get(':year/:month')
  get(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.salesTargetService.get(year, month);
  }

  @Put(':year/:month')
  @UseGuards(RolesGuard)
  @Roles('admin')
  upsert(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body() body: {
      lyTotal: number;
      lyDays: number;
      tysSales: number;
      tyElapsed: number;
      tyRemain: number;
      customPct1?: number;
      customPct2?: number;
    },
  ) {
    return this.salesTargetService.upsert(year, month, body);
  }
}
