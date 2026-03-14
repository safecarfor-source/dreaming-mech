import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const ITEM_RATES: Record<string, number> = {
  brake_oil: 2.8, lining: 1.4, mission_oil: 2.8, diff_oil: 1.0,
  wiper: 0.3, battery: 0.5, ac_filter: 1.0,
  guardian_h3: 2.0, guardian_h5: 2.0, guardian_h7: 2.0,
};

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  // 현재 월 데이터 (최신 uploadDate 기준 누적)
  async getCurrent(month?: string) {
    const targetMonth = month || await this.getLatestMonth();
    if (!targetMonth) return null;

    const data = await this.getMonthData(targetMonth);
    const targets = await this.getTargets(targetMonth);
    const prevMonth = await this.getPrevMonth(targetMonth);
    const prevData = prevMonth ? await this.getMonthData(prevMonth) : null;

    const incentive = this.calcIncentive(data);
    const prevIncentive = prevData ? this.calcIncentive(prevData) : null;

    // 최소수량 체크
    const minQtyCheck = this.checkMinQty(data, targets);
    const penaltyRate = minQtyCheck.hasUnmet ? 0.5 : 1.0;
    const actualIncentive = Math.round(incentive * penaltyRate);
    const lostAmount = incentive - actualIncentive;

    return {
      month: targetMonth,
      items: data,
      targets,
      incentive: {
        calculated: incentive,
        penaltyRate,
        actual: actualIncentive,
        lost: lostAmount,
      },
      minQtyCheck,
      prevMonth: prevMonth ? {
        month: prevMonth,
        incentive: prevIncentive,
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
      const data = await this.getMonthData(month);
      const targets = await this.getTargets(month);
      const incentive = this.calcIncentive(data);
      const minQtyCheck = this.checkMinQty(data, targets);
      const penaltyRate = minQtyCheck.hasUnmet ? 0.5 : 1.0;

      result.push({
        month,
        incentive: Math.round(incentive * penaltyRate),
        fullIncentive: incentive,
        penalized: minQtyCheck.hasUnmet,
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

  // 최근 N개월 품목별 수량
  async getItemQtyHistory(count = 5) {
    const months = await this.prisma.incentiveData.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'desc' },
      take: count,
    });

    const result: Array<{ month: string; items: Record<string, number> }> = [];
    for (const { month } of months.reverse()) {
      const data = await this.getMonthData(month);
      const items: Record<string, number> = {};
      for (const [key, val] of Object.entries(data)) {
        items[key] = val.qty;
      }
      result.push({ month, items });
    }
    return result;
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

  private async getMonthData(month: string) {
    // 해당 월의 최신 uploadDate 데이터
    const latest = await this.prisma.incentiveData.findFirst({
      where: { month },
      orderBy: { uploadDate: 'desc' },
      select: { uploadDate: true },
    });
    if (!latest) return {};

    const rows = await this.prisma.incentiveData.findMany({
      where: { month, uploadDate: latest.uploadDate },
    });

    const result: Record<string, { sales: number; qty: number }> = {};
    for (const row of rows) {
      result[row.itemKey] = { sales: row.sales, qty: row.qty };
    }
    return result;
  }

  private async getTargets(month: string) {
    const rows = await this.prisma.incentiveTarget.findMany({ where: { month } });
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.itemKey] = row.minQty;
    }
    return result;
  }

  private calcIncentive(data: Record<string, { sales: number; qty: number }>) {
    let total = 0;
    for (const [key, val] of Object.entries(data)) {
      const rate = ITEM_RATES[key] || 0;
      total += val.sales * (rate / 100);
    }
    return Math.round(total);
  }

  private checkMinQty(
    data: Record<string, { sales: number; qty: number }>,
    targets: Record<string, number>,
  ) {
    const items: Array<{
      itemKey: string;
      current: number;
      target: number;
      met: boolean;
      remaining: number;
    }> = [];
    let hasUnmet = false;

    for (const [itemKey, minQty] of Object.entries(targets)) {
      if (minQty <= 0) continue;
      const current = data[itemKey]?.qty || 0;
      const met = current >= minQty;
      if (!met) hasUnmet = true;
      items.push({
        itemKey,
        current,
        target: minQty,
        met,
        remaining: met ? 0 : minQty - current,
      });
    }

    return {
      hasUnmet,
      metCount: items.filter(i => i.met).length,
      totalCount: items.length,
      items,
    };
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
