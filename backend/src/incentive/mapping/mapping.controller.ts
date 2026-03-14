import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/mapping')
@UseGuards(IncentiveJwtGuard, RolesGuard)
@Roles('admin')
export class MappingController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.productCodeMapping.findMany({ orderBy: { code: 'asc' } });
  }

  @Post()
  create(@Body() body: { code: string; isPrefix: boolean; category: string; label: string; isIncentive: boolean }) {
    return this.prisma.productCodeMapping.create({ data: body });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.productCodeMapping.update({ where: { id }, data: body });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prisma.productCodeMapping.delete({ where: { id } });
  }
}
