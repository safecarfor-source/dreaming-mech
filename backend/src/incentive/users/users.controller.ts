import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
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
    const hashed = await bcrypt.hash(body.password, 10);
    return this.prisma.incentiveUser.create({
      data: { loginId: body.loginId, password: hashed, name: body.name, role: body.role },
      select: { id: true, loginId: true, name: true, role: true },
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data: any = {};
    if (body.name) data.name = body.name;
    if (body.role) data.role = body.role;
    if (body.password) data.password = await bcrypt.hash(body.password, 10);
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
