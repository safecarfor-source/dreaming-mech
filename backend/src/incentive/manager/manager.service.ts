import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(month?: string) {
    const targetMonth = month || await this.getLatestMonth();
    if (!targetMonth) return null;

    const data = await this.getLatestData(targetMonth);
    if (!data) return null;

    const config = await this.getConfig();
    const teamIncentive = await this.getTeamIncentive(targetMonth);

    const tireIncentive = Math.round((data.tireSales + data.alignmentSales) * config.tireRate);
    const teamBonus = Math.round(teamIncentive.actual * config.teamMultiplier);
    const totalIncentive = tireIncentive + teamBonus;
    const baseSalary = 3300000;
    const totalSalary = baseSalary + totalIncentive;

    // 감액 없었을 때
    const fullTeamBonus = Math.round(teamIncentive.calculated * config.teamMultiplier);
    const fullTotalIncentive = tireIncentive + fullTeamBonus;
    const lost = fullTotalIncentive - totalIncentive;

    return {
      month: targetMonth,
      tireSales: data.tireSales,
      alignmentSales: data.alignmentSales,
      tireIncentive,
      teamIncentive: teamIncentive.actual,
      teamBonus,
      totalIncentive,
      baseSalary,
      totalSalary,
      // 손해 가시화
      fullTotalIncentive,
      lost,
      penalized: teamIncentive.penalized,
    };
  }

  async getMonthly() {
    const months = await this.prisma.managerIncentiveData.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'asc' },
    });

    const result = [];
    for (const { month } of months) {
      const data = await this.getCurrent(month);
      if (data) result.push(data);
    }
    return result;
  }

  private async getLatestData(month: string) {
    return this.prisma.managerIncentiveData.findFirst({
      where: { month },
      orderBy: { uploadDate: 'desc' },
    });
  }

  private async getConfig() {
    const configs = await this.prisma.incentiveConfig.findMany({
      where: { key: { in: ['manager_tire_rate', 'manager_team_multiplier'] } },
    });
    const map = Object.fromEntries(configs.map(c => [c.key, c.value]));
    return {
      tireRate: map['manager_tire_rate'] || 0.003,
      teamMultiplier: map['manager_team_multiplier'] || 1.5,
    };
  }

  private async getTeamIncentive(month: string) {
    // TeamService 로직 재사용 (간소화)
    const latest = await this.prisma.incentiveData.findFirst({
      where: { month },
      orderBy: { uploadDate: 'desc' },
      select: { uploadDate: true },
    });
    if (!latest) return { calculated: 0, actual: 0, penalized: false };

    const rows = await this.prisma.incentiveData.findMany({
      where: { month, uploadDate: latest.uploadDate },
    });

    const RATES: Record<string, number> = {
      brake_oil: 2.8, lining: 1.4, mission_oil: 2.8, diff_oil: 1.0,
      wiper: 0.3, battery: 0.5, ac_filter: 1.0,
      guardian_h3: 2.0, guardian_h5: 2.0, guardian_h7: 2.0,
    };

    let calculated = 0;
    for (const row of rows) {
      calculated += row.sales * ((RATES[row.itemKey] || 0) / 100);
    }
    calculated = Math.round(calculated);

    // 최소수량 체크
    const targets = await this.prisma.incentiveTarget.findMany({ where: { month } });
    let penalized = false;
    for (const t of targets) {
      if (t.minQty <= 0) continue;
      const row = rows.find(r => r.itemKey === t.itemKey);
      if (!row || row.qty < t.minQty) { penalized = true; break; }
    }

    const actual = penalized ? Math.round(calculated * 0.5) : calculated;
    return { calculated, actual, penalized };
  }

  private async getLatestMonth() {
    const latest = await this.prisma.managerIncentiveData.findFirst({
      orderBy: { month: 'desc' },
      select: { month: true },
    });
    return latest?.month || null;
  }
}
