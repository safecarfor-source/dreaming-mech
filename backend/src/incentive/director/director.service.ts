import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DirectorService {
  constructor(private prisma: PrismaService) {}

  async getCurrent(month?: string) {
    const targetMonth = month || await this.getLatestMonth();
    if (!targetMonth) return null;

    const data = await this.getLatestData(targetMonth);
    if (!data) return null;

    const config = await this.getConfig();

    const revenueIncentive = Math.round(data.totalRevenue * config.revenueRate);
    const wiperIncentive = Math.round(data.wiperSales * config.wiperRate);
    const batteryIncentive = Math.round(data.batterySales * config.batteryRate);
    const acFilterIncentive = Math.round(data.acFilterSales * config.acFilterRate);
    const totalIncentive = revenueIncentive + wiperIncentive + batteryIncentive + acFilterIncentive;

    const breakeven = config.breakeven;
    const aboveBreakeven = data.totalRevenue >= breakeven;

    return {
      month: targetMonth,
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

  async getMonthly() {
    const months = await this.prisma.directorIncentiveData.findMany({
      select: { month: true },
      distinct: ['month'],
      orderBy: { month: 'asc' },
    });

    const result: any[] = [];
    for (const { month } of months) {
      const data = await this.getCurrent(month);
      if (data) result.push(data);
    }
    return result;
  }

  private async getLatestData(month: string) {
    return this.prisma.directorIncentiveData.findFirst({
      where: { month },
      orderBy: { uploadDate: 'desc' },
    });
  }

  private async getConfig() {
    const configs = await this.prisma.incentiveConfig.findMany({
      where: {
        key: {
          in: [
            'director_revenue_rate', 'director_wiper_rate',
            'director_battery_rate', 'director_acfilter_rate',
            'director_breakeven',
          ],
        },
      },
    });
    const map = Object.fromEntries(configs.map(c => [c.key, c.value]));
    return {
      revenueRate: map['director_revenue_rate'] || 0.006,
      wiperRate: map['director_wiper_rate'] || 0.003,
      batteryRate: map['director_battery_rate'] || 0.005,
      acFilterRate: map['director_acfilter_rate'] || 0.01,
      breakeven: map['director_breakeven'] || 145000000,
    };
  }

  private async getLatestMonth() {
    const latest = await this.prisma.directorIncentiveData.findFirst({
      orderBy: { month: 'desc' },
      select: { month: true },
    });
    return latest?.month || null;
  }
}
