import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ITEM_RATES } from '../constants/rates';
import { CalcEngineService } from '../calc/calc-engine.service';

@Injectable()
export class TeamService {
  constructor(
    private prisma: PrismaService,
    private calcEngine: CalcEngineService,
  ) {}

  // 현재 월 데이터 (최신 uploadDate 기준 누적)
  async getCurrent(month?: string) {
    const targetMonth = month || await this.getLatestMonth();
    if (!targetMonth) return null;

    const data = await this.calcEngine.fetchTeamData(targetMonth);
    const targets = await this.calcEngine.fetchTargets(targetMonth);
    const prevMonth = await this.getPrevMonth(targetMonth);
    const prevData = prevMonth ? await this.calcEngine.fetchTeamData(prevMonth) : null;

    const prevIncentive = prevData ? this.calcEngine.sumIncentive(prevData) : null;

    // CalcEngine에서 계산 (단일 소스)
    const result = await this.calcEngine.calcTeam(targetMonth);

    return {
      month: targetMonth,
      items: data,
      targets,
      incentive: {
        calculated: result.calculated,
        penaltyRate: result.penaltyRate,
        actual: result.actual,
        lost: result.lost,
      },
      minQtyCheck: result.minQtyCheck,
      prevMonth: prevMonth ? {
        month: prevMonth,
        incentive: prevIncentive,
        items: prevData || {},
      } : null,
    };
  }

  // 월별 전체 데이터
  async getMonthly() {
    const months = await this.prisma.incentiveData.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'asc' },
    });

    const result: any[] = [];
    for (const { month } of months) {
      const calc = await this.calcEngine.calcTeam(month);
      result.push({
        month,
        incentive: calc.actual,
        fullIncentive: calc.calculated,
        penalized: calc.penalized,
      });
    }
    return result;
  }

  // 주간 추이
  async getWeekly(month: string) {
    const rows = await this.prisma.incentiveData.findMany({
      where: { month },
      orderBy: { uploadDate: 'asc' },
    });

    // uploadDate별로 그룹핑
    const byDate: Record<string, Record<string, { sales: number; qty: number }>> = {};
    for (const row of rows) {
      const dateKey = row.uploadDate.toISOString().slice(0, 10);
      if (!byDate[dateKey]) byDate[dateKey] = {};
      byDate[dateKey][row.itemKey] = { sales: row.sales, qty: row.qty };
    }

    // 주차 구분 (1~7=1주차, 8~14=2주차, 15~21=3주차, 22~=4주차)
    const weeks: Record<string, { sales: number; qty: number; incentive: number }> = {};
    for (const [dateStr, items] of Object.entries(byDate)) {
      const day = new Date(dateStr).getDate();
      const week = day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4;
      const weekKey = `${week}주차`;

      if (!weeks[weekKey]) weeks[weekKey] = { sales: 0, qty: 0, incentive: 0 };
      for (const [key, val] of Object.entries(items)) {
        weeks[weekKey].sales += val.sales;
        weeks[weekKey].qty += val.qty;
        const rate = ITEM_RATES[key] || 0;
        weeks[weekKey].incentive += Math.round(val.sales * rate / 100);
      }
    }

    return { month, weeks };
  }

  // 최근 N개월 품목별 수량 + 전체 월별 최소수량 타겟
  async getItemQtyHistory(count = 5) {
    const months = await this.prisma.incentiveData.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'desc' },
      take: count,
    });

    const history: Array<{ month: string; items: Record<string, number> }> = [];
    for (const { month } of months.reverse()) {
      const data = await this.calcEngine.fetchTeamData(month);
      const items: Record<string, number> = {};
      for (const [key, val] of Object.entries(data)) {
        items[key] = val.qty;
      }
      history.push({ month, items });
    }

    // 전체 월별 최소수량 타겟도 함께 반환
    const allTargets = await this.prisma.incentiveTarget.findMany();
    const targetsByMonth: Record<string, Record<string, number>> = {};
    for (const t of allTargets) {
      if (!targetsByMonth[t.month]) targetsByMonth[t.month] = {};
      targetsByMonth[t.month][t.itemKey] = t.minQty;
    }

    return { history, targets: targetsByMonth };
  }

  // 목표 설정
  async setTargets(month: string, targets: Record<string, number>) {
    for (const [itemKey, minQty] of Object.entries(targets)) {
      await this.prisma.incentiveTarget.upsert({
        where: { month_itemKey: { month, itemKey } },
        create: { month, itemKey, minQty },
        update: { minQty },
      });
    }
    return { success: true };
  }

  // --- 내부 헬퍼 ---

  async getTargetsOnly(month: string) {
    return this.calcEngine.fetchTargets(month);
  }

  private async getLatestMonth() {
    const latest = await this.prisma.incentiveData.findFirst({
      orderBy: { month: 'desc' },
      select: { month: true },
    });
    return latest?.month || null;
  }

  private async getPrevMonth(month: string) {
    const months = await this.prisma.incentiveData.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'asc' },
    });
    const idx = months.findIndex(m => m.month === month);
    return idx > 0 ? months[idx - 1].month : null;
  }
}
