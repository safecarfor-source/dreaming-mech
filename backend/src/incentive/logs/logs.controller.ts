import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/logs')
@UseGuards(IncentiveJwtGuard, RolesGuard)
@Roles('admin')
export class LogsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.incentiveEditLog.findMany({
      include: { user: { select: { name: true, loginId: true } } },
      orderBy: { editedAt: 'desc' },
      take: 100,
    });
  }
}
