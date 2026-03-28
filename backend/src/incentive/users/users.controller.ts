import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';
import * as bcrypt from 'bcrypt';

@Controller('incentive/users')
@UseGuards(IncentiveJwtGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll() {
    const users = await this.prisma.incentiveUser.findMany({
      select: { id: true, loginId: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return users;
  }

  @Post()
  async create(@Body() body: { loginId: string; password: string; name: string; role: string }) {
    const allowedRoles = ['admin', 'viewer', 'user'];
    if (!body.loginId || body.loginId.length < 3) throw new BadRequestException('loginId는 3자 이상');
    if (!body.password || body.password.length < 8) throw new BadRequestException('password는 8자 이상');
    if (!allowedRoles.includes(body.role)) throw new BadRequestException('role은 admin/viewer/user 중 하나');
    const hashed = await bcrypt.hash(body.password, 10);
    return this.prisma.incentiveUser.create({
      data: { loginId: body.loginId, password: hashed, name: body.name, role: body.role },
      select: { id: true, loginId: true, name: true, role: true },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const allowedRoles = ['admin', 'viewer', 'user'];
    if (body.loginId !== undefined && body.loginId.length < 3) throw new BadRequestException('loginId는 3자 이상');
    if (body.password !== undefined && body.password.length < 8) throw new BadRequestException('password는 8자 이상');
    if (body.role !== undefined && !allowedRoles.includes(body.role)) throw new BadRequestException('role은 admin/viewer/user 중 하나');
    const data: any = {};
    if (body.name) data.name = body.name;
    if (body.role) data.role = body.role;
    if (body.loginId) data.loginId = body.loginId;
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10);
    }
    return this.prisma.incentiveUser.update({
      where: { id },
      data,
      select: { id: true, loginId: true, name: true, role: true },
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prisma.incentiveUser.delete({ where: { id } });
  }
}
