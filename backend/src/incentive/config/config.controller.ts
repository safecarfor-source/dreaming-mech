import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
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
  update(@Param('key') key: string, @Body() body: { value: number }) {
    return this.prisma.incentiveConfig.update({
      where: { key },
      data: { value: body.value },
    });
  }
}
