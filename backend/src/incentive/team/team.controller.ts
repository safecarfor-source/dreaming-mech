import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { TeamService } from './team.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/team')
@UseGuards(IncentiveJwtGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Get('current')
  getCurrent(@Query('month') month?: string) {
    return this.teamService.getCurrent(month);
  }

  @Get('monthly')
  getMonthly() {
    return this.teamService.getMonthly();
  }

  @Get('weekly')
  getWeekly(@Query('month') month: string) {
    return this.teamService.getWeekly(month);
  }

  @Get('targets')
  getTargets(@Query('month') month: string) {
    return this.teamService.getCurrent(month);
  }

  @Get('item-qty-history')
  getItemQtyHistory() {
    return this.teamService.getItemQtyHistory(5);
  }

  @Post('targets')
  @UseGuards(RolesGuard)
  @Roles('admin')
  setTargets(@Body() body: { month: string; targets: Record<string, number> }) {
    return this.teamService.setTargets(body.month, body.targets);
  }
}
