import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveIncentiveDto } from './dto/save-incentive.dto';

@Injectable()
export class IncentiveService {
  constructor(private prisma: PrismaService) {}

  // 전체 데이터 조회 (모든 월)
  async findAll() {
    const rows = await this.prisma.incentive.findMany({
      orderBy: [{ month: 'asc' }, { itemKey: 'asc' }],
    });

    // DB 행 → { "26년 3월": { brake_oil: { sales, qty }, ... } } 형태로 변환
    const result: Record<string, Record<string, { sales: number; qty: number }>> = {};
    for (const row of rows) {
      if (!result[row.month]) result[row.month] = {};
      result[row.month][row.itemKey] = { sales: row.sales, qty: row.qty };
    }
    return result;
  }

  // 특정 월 데이터 조회
  async findByMonth(month: string) {
    const rows = await this.prisma.incentive.findMany({
      where: { month },
    });

    const result: Record<string, { sales: number; qty: number }> = {};
    for (const row of rows) {
      result[row.itemKey] = { sales: row.sales, qty: row.qty };
    }
    return result;
  }

  // 데이터 저장 (upsert — 없으면 생성, 있으면 수정)
  async save(dto: SaveIncentiveDto) {
    for (const [itemKey, data] of Object.entries(dto.items)) {
      await this.prisma.incentive.upsert({
        where: { month_itemKey: { month: dto.month, itemKey } },
        create: {
          month: dto.month,
          itemKey,
          sales: data.sales || 0,
          qty: data.qty || 0,
        },
        update: {
          sales: data.sales || 0,
          qty: data.qty || 0,
        },
      });
    }
    return { success: true, month: dto.month };
  }

  // 전체 데이터 일괄 저장 (초기 데이터 이관용)
  async saveAll(data: Record<string, Record<string, { sales: number; qty: number }>>) {
    let count = 0;
    for (const [month, items] of Object.entries(data)) {
      for (const [itemKey, values] of Object.entries(items)) {
        await this.prisma.incentive.upsert({
          where: { month_itemKey: { month, itemKey } },
          create: {
            month,
            itemKey,
            sales: values.sales || 0,
            qty: values.qty || 0,
          },
          update: {
            sales: values.sales || 0,
            qty: values.qty || 0,
          },
        });
        count++;
      }
    }
    return { success: true, count };
  }

  // 월 삭제
  async deleteMonth(month: string) {
    await this.prisma.incentive.deleteMany({ where: { month } });
    return { success: true, month };
  }
}
