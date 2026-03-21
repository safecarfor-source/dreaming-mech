import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ITEM_RATES } from '../constants/rates';

// 서비스 아이템 품목 키 (팀 인센티브 대상)
const SERVICE_ITEM_KEYS = [
  'brake_oil', 'lining', 'mission_oil', 'diff_oil',
  'wiper', 'battery', 'ac_filter',
  'guardian_h3', 'guardian_h5', 'guardian_h7',
];

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // year/month 숫자를 "26년 3월" 형식 문자열로 변환
  private toMonthStr(year: number, month: number): string {
    return `${year - 2000}년 ${month}월`;
  }

  // 전월 year/month 계산
  private prevYearMonth(year: number, month: number): { year: number; month: number } {
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
  }

  // 작년 동월 year/month 계산
  private prevYearSameMonth(year: number, month: number): { year: number; month: number } {
    return { year: year - 1, month };
  }

  // 팀 인센티브 데이터 조회 (해당 월 최신 업로드 기준)
  private async getTeamData(monthStr: string) {
    const latest = await this.prisma.incentiveData.findFirst({
      where: { month: monthStr },
      orderBy: { uploadDate: 'desc' },
      select: { uploadDate: true },
    });
    if (!latest) return {};

    const rows = await this.prisma.incentiveData.findMany({
      where: { month: monthStr, uploadDate: latest.uploadDate },
    });

    const result: Record<string, { sales: number; qty: number }> = {};
    for (const row of rows) {
      result[row.itemKey] = { sales: row.sales, qty: row.qty };
    }
    return result;
  }

  // 팀 인센티브 계산 (최소수량 페널티 포함)
  private async calcTeamIncentive(monthStr: string) {
    const data = await this.getTeamData(monthStr);
    if (Object.keys(data).length === 0) {
      return { calculated: 0, actual: 0, lost: 0 };
    }

    let calculated = 0;
    for (const [key, val] of Object.entries(data)) {
      const rate = ITEM_RATES[key] || 0;
      calculated += val.sales * (rate / 100);
    }
    calculated = Math.round(calculated);

    // 최소수량 체크
    const targets = await this.prisma.incentiveTarget.findMany({
      where: { month: monthStr },
    });
    let penalized = false;
    for (const t of targets) {
      if (t.minQty <= 0) continue;
      const row = data[t.itemKey];
      if (!row || row.qty < t.minQty) { penalized = true; break; }
    }

    const actual = penalized ? Math.round(calculated * 0.5) : calculated;
    const lost = calculated - actual;
    return { calculated, actual, lost };
  }

  // 매니저 인센티브 계산
  private async calcManagerIncentive(monthStr: string) {
    const data = await this.prisma.managerIncentiveData.findFirst({
      where: { month: monthStr },
      orderBy: { uploadDate: 'desc' },
    });
    if (!data) return { total: 0, tireSales: 0, alignmentSales: 0 };

    const configs = await this.prisma.incentiveConfig.findMany({
      where: { key: { in: ['manager_tire_rate', 'manager_team_multiplier'] } },
    });
    const map = Object.fromEntries(configs.map(c => [c.key, c.value]));
    const tireRate = map['manager_tire_rate'] || 0.003;
    const teamMultiplier = map['manager_team_multiplier'] || 1.5;

    const teamIncentive = await this.calcTeamIncentive(monthStr);
    const tireIncentive = Math.round((data.tireSales + data.alignmentSales) * tireRate);
    const teamBonus = Math.round(teamIncentive.actual * teamMultiplier);
    const total = tireIncentive + teamBonus;

    return {
      total,
      tireSales: data.tireSales,
      alignmentSales: data.alignmentSales,
    };
  }

  // 부장(이정석) 인센티브 계산
  private async calcDirectorIncentive(monthStr: string) {
    const data = await this.prisma.directorIncentiveData.findFirst({
      where: { month: monthStr },
      orderBy: { uploadDate: 'desc' },
    });
    if (!data) return { amount: 0, totalRevenue: 0 };

    const configs = await this.prisma.incentiveConfig.findMany({
      where: {
        key: {
          in: [
            'director_revenue_rate', 'director_wiper_rate',
            'director_battery_rate', 'director_acfilter_rate',
          ],
        },
      },
    });
    const map = Object.fromEntries(configs.map(c => [c.key, c.value]));
    const revenueRate = map['director_revenue_rate'] || 0.006;
    const wiperRate = map['director_wiper_rate'] || 0.003;
    const batteryRate = map['director_battery_rate'] || 0.005;
    const acFilterRate = map['director_acfilter_rate'] || 0.01;

    const amount =
      Math.round(data.totalRevenue * revenueRate) +
      Math.round(data.wiperSales * wiperRate) +
      Math.round(data.batterySales * batteryRate) +
      Math.round(data.acFilterSales * acFilterRate);

    return { amount, totalRevenue: data.totalRevenue };
  }

  // 월별 추이 데이터 (최근 N개월)
  private async getMonthlyTrend(year: number, month: number, count = 6) {
    const trend: Array<{ month: string; revenue: number }> = [];

    let y = year;
    let m = month;

    // count개월치 역순으로 수집
    for (let i = 0; i < count; i++) {
      const monthStr = this.toMonthStr(y, m);
      const dirData = await this.prisma.directorIncentiveData.findFirst({
        where: { month: monthStr },
        orderBy: { uploadDate: 'desc' },
      });

      if (dirData) {
        trend.unshift({ month: monthStr, revenue: dirData.totalRevenue });
      }

      // 이전 달로 이동
      const prev = this.prevYearMonth(y, m);
      y = prev.year;
      m = prev.month;
    }

    return trend;
  }

  // 종합 대시보드 데이터
  async getSummary(year: number, month: number) {
    const monthStr = this.toMonthStr(year, month);
    const prevYM = this.prevYearMonth(year, month);
    const prevYearYM = this.prevYearSameMonth(year, month);
    const prevMonthStr = this.toMonthStr(prevYM.year, prevYM.month);
    const prevYearMonthStr = this.toMonthStr(prevYearYM.year, prevYearYM.month);

    // 부장 데이터에서 totalRevenue 가져오기
    const directorData = await this.prisma.directorIncentiveData.findFirst({
      where: { month: monthStr },
      orderBy: { uploadDate: 'desc' },
    });

    const totalRevenue = directorData?.totalRevenue || 0;

    // 팀 서비스 아이템 데이터
    const teamData = await this.getTeamData(monthStr);
    let serviceItemsTotal = 0;
    const itemDetails: Record<string, { sales: number; qty: number }> = {};
    for (const key of SERVICE_ITEM_KEYS) {
      if (teamData[key]) {
        serviceItemsTotal += teamData[key].sales;
        itemDetails[key] = teamData[key];
      }
    }

    // 매니저 데이터에서 타이어/얼라인 매출
    const managerData = await this.prisma.managerIncentiveData.findFirst({
      where: { month: monthStr },
      orderBy: { uploadDate: 'desc' },
    });
    const tireSales = managerData?.tireSales || 0;
    const alignmentSales = managerData?.alignmentSales || 0;

    // 기타 = totalRevenue - 서비스아이템합 - 타이어 - 얼라인
    const other = Math.max(0, totalRevenue - serviceItemsTotal - tireSales - alignmentSales);

    // 전월 매출
    const prevMonthDirectorData = await this.prisma.directorIncentiveData.findFirst({
      where: { month: prevMonthStr },
      orderBy: { uploadDate: 'desc' },
    });
    const prevMonthRevenue = prevMonthDirectorData?.totalRevenue || 0;
    const prevMonthChange = prevMonthRevenue > 0
      ? Math.round(((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 1000) / 10
      : 0;

    // 작년 동월 매출
    const prevYearDirectorData = await this.prisma.directorIncentiveData.findFirst({
      where: { month: prevYearMonthStr },
      orderBy: { uploadDate: 'desc' },
    });
    const prevYearRevenue = prevYearDirectorData?.totalRevenue || 0;
    const prevYearChange = prevYearRevenue > 0
      ? Math.round(((totalRevenue - prevYearRevenue) / prevYearRevenue) * 1000) / 10
      : 0;

    // 현금흐름 데이터
    const cashFlowData = await this.prisma.cashFlow.findUnique({
      where: { year_month: { year, month } },
    });
    const prevCashFlowData = await this.prisma.cashFlow.findUnique({
      where: { year_month: { year: prevYM.year, month: prevYM.month } },
    });

    const cash = Number(cashFlowData?.cash || 0);
    const investment = Number(cashFlowData?.investment || 0);
    const inventory = Number(cashFlowData?.inventory || 0);
    const totalAssets = cash + investment + inventory;

    const prevCash = Number(prevCashFlowData?.cash || 0);
    const prevInvestment = Number(prevCashFlowData?.investment || 0);
    const prevInventory = Number(prevCashFlowData?.inventory || 0);
    const prevTotalAssets = prevCash + prevInvestment + prevInventory;

    // 인센티브 계산
    const teamIncentive = await this.calcTeamIncentive(monthStr);
    const managerIncentive = await this.calcManagerIncentive(monthStr);
    const directorIncentive = await this.calcDirectorIncentive(monthStr);
    const grandTotal = teamIncentive.actual + managerIncentive.total + directorIncentive.amount;

    // 월별 추이
    const monthlyTrend = await this.getMonthlyTrend(year, month, 6);

    return {
      year,
      month,
      revenue: {
        total: totalRevenue,
        serviceItems: serviceItemsTotal,
        tire: tireSales,
        alignment: alignmentSales,
        other,
        items: itemDetails,
      },
      prevMonth: {
        total: prevMonthRevenue,
        change: prevMonthChange,
      },
      prevYear: {
        total: prevYearRevenue,
        change: prevYearChange,
      },
      cashflow: {
        cash,
        investment,
        inventory,
        totalAssets,
        prevMonth: prevCashFlowData
          ? {
              cash: prevCash,
              totalAssets: prevTotalAssets,
              cashChange: cash - prevCash,
              assetChange: totalAssets - prevTotalAssets,
            }
          : null,
      },
      incentive: {
        team: teamIncentive,
        manager: { total: managerIncentive.total },
        director: { amount: directorIncentive.amount },
        grandTotal,
      },
      monthlyTrend,
    };
  }

  // 현금흐름 데이터 조회
  async getCashFlow(year: number, month: number) {
    const data = await this.prisma.cashFlow.findUnique({
      where: { year_month: { year, month } },
    });

    if (!data) {
      return { year, month, cash: 0, investment: 0, inventory: 0, totalAssets: 0 };
    }

    const cash = Number(data.cash);
    const investment = Number(data.investment);
    const inventory = Number(data.inventory);

    return {
      year,
      month,
      cash,
      investment,
      inventory,
      totalAssets: cash + investment + inventory,
    };
  }

  // 월초 이월시재 조회
  async getOpeningCash(year: number, month: number) {
    const data = await this.prisma.cashFlow.findUnique({
      where: { year_month: { year, month } },
    });
    return {
      year,
      month,
      openingCash: data?.openingCash != null ? Number(data.openingCash) : null,
    };
  }

  // 월초 이월시재 설정
  async setOpeningCash(year: number, month: number, openingCash: number) {
    const value = BigInt(Math.round(openingCash));
    await this.prisma.cashFlow.upsert({
      where: { year_month: { year, month } },
      create: { year, month, openingCash: value },
      update: { openingCash: value },
    });
    return { year, month, openingCash: Number(value) };
  }

  // 현금흐름 데이터 저장 (upsert)
  async saveCashFlow(
    year: number,
    month: number,
    data: { cash?: number; investment?: number; inventory?: number },
  ) {
    const cash = BigInt(Math.round(data.cash || 0));
    const investment = BigInt(Math.round(data.investment || 0));
    const inventory = BigInt(Math.round(data.inventory || 0));

    const result = await this.prisma.cashFlow.upsert({
      where: { year_month: { year, month } },
      create: { year, month, cash, investment, inventory },
      update: { cash, investment, inventory },
    });

    const cashNum = Number(result.cash);
    const investmentNum = Number(result.investment);
    const inventoryNum = Number(result.inventory);

    return {
      year: result.year,
      month: result.month,
      cash: cashNum,
      investment: investmentNum,
      inventory: inventoryNum,
      totalAssets: cashNum + investmentNum + inventoryNum,
    };
  }
}
