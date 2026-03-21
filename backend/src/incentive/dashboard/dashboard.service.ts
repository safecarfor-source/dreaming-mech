import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalcEngineService } from '../calc/calc-engine.service';

// 서비스 아이템 품목 키 (팀 인센티브 대상)
const SERVICE_ITEM_KEYS = [
  'brake_oil', 'lining', 'mission_oil', 'diff_oil',
  'wiper', 'battery', 'ac_filter',
  'guardian_h3', 'guardian_h5', 'guardian_h7',
];

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private calcEngine: CalcEngineService,
  ) {}

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
    const teamData = await this.calcEngine.fetchTeamData(monthStr);
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

    // 인센티브 계산 — CalcEngine 단일 소스 사용
    const dashboardCalc = await this.calcEngine.calcDashboard(monthStr);

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
        team: dashboardCalc.team,
        manager: dashboardCalc.manager,
        director: dashboardCalc.director,
        grandTotal: dashboardCalc.grandTotal,
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
