import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalcEngineService } from './calc-engine.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

interface CalcBody {
  year: number;
  month: number;
}

// year/month 숫자를 "26년 3월" 형식 문자열로 변환 (DashboardService와 동일)
function toMonthStr(year: number, month: number): string {
  return `${year - 2000}년 ${month}월`;
}

@Controller('incentive/calc')
@UseGuards(IncentiveJwtGuard, RolesGuard)
@Roles('admin')
export class CalcController {
  constructor(
    private calcEngine: CalcEngineService,
    private prisma: PrismaService,
  ) {}

  @Post('team')
  async calcTeam(@Body() body: CalcBody) {
    const month = toMonthStr(body.year, body.month);
    return this.calcEngine.calcTeam(month);
  }

  @Post('manager')
  async calcManager(@Body() body: CalcBody) {
    const month = toMonthStr(body.year, body.month);
    return this.calcEngine.calcManager(month);
  }

  @Post('director')
  async calcDirector(@Body() body: CalcBody) {
    const month = toMonthStr(body.year, body.month);
    return this.calcEngine.calcDirector(month);
  }

  @Post('dashboard')
  async calcDashboard(@Body() body: CalcBody) {
    const month = toMonthStr(body.year, body.month);
    return this.calcEngine.calcDashboard(month);
  }

  @Post('all')
  async calcAll(@Body() body: CalcBody) {
    const month = toMonthStr(body.year, body.month);
    return this.calcEngine.calcAll(month);
  }

  @Get('history')
  async getHistory(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 20;
    return this.prisma.incentiveEditLog.findMany({
      orderBy: { editedAt: 'desc' },
      take,
      select: { id: true, editedAt: true, detail: true },
    });
  }
}
