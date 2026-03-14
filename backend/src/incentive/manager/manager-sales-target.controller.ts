import { Controller, Get, Put, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ManagerSalesTargetService } from './manager-sales-target.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/manager-sales-target')
@UseGuards(IncentiveJwtGuard)
export class ManagerSalesTargetController {
  constructor(private managerSalesTargetService: ManagerSalesTargetService) {}

  @Get(':year/:month')
  get(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.managerSalesTargetService.get(year, month);
  }

  @Put(':year/:month')
  @UseGuards(RolesGuard)
  @Roles('admin')
  upsert(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Body() body: {
      lyDays?: number;
      tyElapsed?: number;
      tyRemain?: number;
    },
  ) {
    return this.managerSalesTargetService.upsert(year, month, body);
  }
}
