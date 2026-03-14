import { Controller, Get, Put, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/config')
@UseGuards(IncentiveJwtGuard)
export class ConfigController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.incentiveConfig.findMany({ orderBy: { key: 'asc' } });
  }

  @Put(':key')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('key') key: string, @Body() body: { value: number; label?: string }) {
    return this.prisma.incentiveConfig.upsert({
      where: { key },
      create: { key, value: body.value, label: body.label || key },
      update: { value: body.value },
    });
  }

  // 품목 순서 일괄 저장
  @Post('item-order')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async saveItemOrder(@Body() body: { order: string[] }) {
    const ops = body.order.map((itemKey, idx) =>
      this.prisma.incentiveConfig.upsert({
        where: { key: `item_order_${itemKey}` },
        create: { key: `item_order_${itemKey}`, value: idx, label: `${itemKey} 표시 순서` },
        update: { value: idx },
      }),
    );
    await this.prisma.$transaction(ops);
    return { success: true, order: body.order };
  }
}
