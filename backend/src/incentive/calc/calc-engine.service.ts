import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ITEM_RATES, BASE_SALARY, DEFAULT_DIRECTOR_RATES } from '../constants/rates';
import {
  AllCalcResult,
  DashboardCalcResult,
  DirectorCalcResult,
  ManagerCalcResult,
  MinQtyCheckResult,
  TeamCalcResult,
} from './calc-engine.types';

@Injectable()
export class CalcEngineService {
  constructor(private prisma: PrismaService) {}

  // ── 블럭 A: 팀 인센티브 ──────────────────────────────────────────────────────
  async calcTeam(month: string): Promise<TeamCalcResult> {
    const data = await this.fetchTeamData(month);
    const targets = await this.fetchTargets(month);

    const calculated = this.sumIncentive(data);
    const minQtyCheck = this.checkMinQty(data, targets);
    const penaltyRate = minQtyCheck.hasUnmet ? 0.5 : 1.0;
    const actual = Math.round(calculated * penaltyRate);
    const lost = calculated - actual;

    return {
      month,
      calculated,
      actual,
      lost,
      penaltyRate,
      penalized: minQtyCheck.hasUnmet,
      minQtyCheck,
    };
  }

  // ── 블럭 B: 매니저(김권중) ────────────────────────────────────────────────────
  async calcManager(month: string): Promise<ManagerCalcResult> {
    const data = await this.prisma.managerIncentiveData.findFirst({
      where: { month },
      orderBy: { uploadDate: 'desc' },
    });
    if (!data) {
      return this.emptyManagerResult(month);
    }

    const config = await this.fetchManagerConfig();
    const team = await this.calcTeam(month);

    const tireIncentive = Math.round((data.tireSales + data.alignmentSales) * config.tireRate);
    const teamBonus = Math.round(team.actual * config.teamMultiplier);
    const totalIncentive = tireIncentive + teamBonus;
    const baseSalary = BASE_SALARY;
    const totalSalary = baseSalary + totalIncentive;

    // 페널티 없었을 때 비교
    const fullTeamBonus = Math.round(team.calculated * config.teamMultiplier);
    const fullTotalIncentive = tireIncentive + fullTeamBonus;
    const lost = fullTotalIncentive - totalIncentive;

    return {
      month,
      tireSales: data.tireSales,
      alignmentSales: data.alignmentSales,
      tireIncentive,
      teamBonus,
      totalIncentive,
      baseSalary,
      totalSalary,
      fullTotalIncentive,
      lost,
      penalized: team.penalized,
    };
  }

  // ── 블럭 C: 부장(이정석) ─────────────────────────────────────────────────────
  async calcDirector(month: string): Promise<DirectorCalcResult> {
    const data = await this.prisma.directorIncentiveData.findFirst({
      where: { month },
      orderBy: { uploadDate: 'desc' },
    });
    if (!data) {
      return this.emptyDirectorResult(month);
    }

    const config = await this.fetchDirectorConfig();

    const revenueIncentive = Math.round(data.totalRevenue * config.revenueRate);
    const wiperIncentive = Math.round(data.wiperSales * config.wiperRate);
    const batteryIncentive = Math.round(data.batterySales * config.batteryRate);
    const acFilterIncentive = Math.round(data.acFilterSales * config.acFilterRate);
    const totalIncentive = revenueIncentive + wiperIncentive + batteryIncentive + acFilterIncentive;

    const breakeven = config.breakeven;
    const aboveBreakeven = data.totalRevenue >= breakeven;

    return {
      month,
      totalRevenue: data.totalRevenue,
      revenueIncentive,
      extras: {
        wiper: { sales: data.wiperSales, incentive: wiperIncentive },
        battery: { sales: data.batterySales, incentive: batteryIncentive },
        acFilter: { sales: data.acFilterSales, incentive: acFilterIncentive },
      },
      totalIncentive,
      breakeven,
      aboveBreakeven,
      shortfall: aboveBreakeven ? 0 : breakeven - data.totalRevenue,
    };
  }

  // ── 블럭 D: 대표 대시보드 집계 ───────────────────────────────────────────────
  async calcDashboard(month: string): Promise<DashboardCalcResult> {
    const [team, manager, director] = await Promise.all([
      this.calcTeam(month),
      this.calcManager(month),
      this.calcDirector(month),
    ]);

    const grandTotal = team.actual + manager.totalIncentive + director.totalIncentive;

    return {
      month,
      team: {
        calculated: team.calculated,
        actual: team.actual,
        lost: team.lost,
      },
      manager: { total: manager.totalIncentive },
      director: { amount: director.totalIncentive },
      grandTotal,
    };
  }

  // ── 연쇄 실행 (A→B→C→D) ─────────────────────────────────────────────────────
  async calcAll(month: string): Promise<AllCalcResult> {
    const team = await this.calcTeam(month);
    const manager = await this.calcManager(month);
    const director = await this.calcDirector(month);
    const dashboard = await this.calcDashboard(month);
    return { team, manager, director, dashboard };
  }

  // ── 내부 헬퍼: DB 조회 ───────────────────────────────────────────────────────

  // 팀 데이터: 해당 월 최신 uploadDate 기준 누적 품목별 데이터
  async fetchTeamData(month: string): Promise<Record<string, { sales: number; qty: number }>> {
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

  // 팀 최소수량 타겟 조회
  async fetchTargets(month: string): Promise<Record<string, number>> {
    const rows = await this.prisma.incentiveTarget.findMany({ where: { month } });
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.itemKey] = row.minQty;
    }
    return result;
  }

  // ── 내부 헬퍼: 순수 계산 ─────────────────────────────────────────────────────

  // 품목별 매출 × 요율 합산
  sumIncentive(data: Record<string, { sales: number; qty: number }>): number {
    let total = 0;
    for (const [key, val] of Object.entries(data)) {
      const rate = ITEM_RATES[key] || 0;
      total += val.sales * (rate / 100);
    }
    return Math.round(total);
  }

  // 최소수량 미달 체크 → 페널티 여부 결정
  checkMinQty(
    data: Record<string, { sales: number; qty: number }>,
    targets: Record<string, number>,
  ): MinQtyCheckResult {
    const items: MinQtyCheckResult['items'] = [];
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
      metCount: items.filter((i) => i.met).length,
      totalCount: items.length,
      items,
    };
  }

  // ── 내부 헬퍼: 설정 조회 ─────────────────────────────────────────────────────

  private async fetchManagerConfig(): Promise<{ tireRate: number; teamMultiplier: number }> {
    const configs = await this.prisma.incentiveConfig.findMany({
      where: { key: { in: ['manager_tire_rate', 'manager_team_multiplier'] } },
    });
    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return {
      tireRate: map['manager_tire_rate'] || 0.003,
      teamMultiplier: map['manager_team_multiplier'] || 1.5,
    };
  }

  private async fetchDirectorConfig(): Promise<{
    revenueRate: number;
    wiperRate: number;
    batteryRate: number;
    acFilterRate: number;
    breakeven: number;
  }> {
    const configs = await this.prisma.incentiveConfig.findMany({
      where: {
        key: {
          in: [
            'director_revenue_rate',
            'director_wiper_rate',
            'director_battery_rate',
            'director_acfilter_rate',
            'director_breakeven',
          ],
        },
      },
    });
    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return {
      revenueRate: map['director_revenue_rate'] || DEFAULT_DIRECTOR_RATES.revenueRate,
      wiperRate: map['director_wiper_rate'] || DEFAULT_DIRECTOR_RATES.wiperRate,
      batteryRate: map['director_battery_rate'] || DEFAULT_DIRECTOR_RATES.batteryRate,
      acFilterRate: map['director_acfilter_rate'] || DEFAULT_DIRECTOR_RATES.acFilterRate,
      breakeven: map['director_breakeven'] || DEFAULT_DIRECTOR_RATES.breakeven,
    };
  }

  // ── 빈 결과 팩토리 (데이터 없을 때) ─────────────────────────────────────────

  private emptyManagerResult(month: string): ManagerCalcResult {
    return {
      month,
      tireSales: 0,
      alignmentSales: 0,
      tireIncentive: 0,
      teamBonus: 0,
      totalIncentive: 0,
      baseSalary: BASE_SALARY,
      totalSalary: BASE_SALARY,
      fullTotalIncentive: 0,
      lost: 0,
      penalized: false,
    };
  }

  private emptyDirectorResult(month: string): DirectorCalcResult {
    return {
      month,
      totalRevenue: 0,
      revenueIncentive: 0,
      extras: {
        wiper: { sales: 0, incentive: 0 },
        battery: { sales: 0, incentive: 0 },
        acFilter: { sales: 0, incentive: 0 },
      },
      totalIncentive: 0,
      breakeven: DEFAULT_DIRECTOR_RATES.breakeven,
      aboveBreakeven: false,
      shortfall: DEFAULT_DIRECTOR_RATES.breakeven,
    };
  }
}
