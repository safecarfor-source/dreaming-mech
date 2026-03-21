import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class IncentiveAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginId: string, password: string) {
    const user = await this.prisma.incentiveUser.findUnique({
      where: { loginId },
    });
    if (!user) throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다');

    const token = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: '7d' },
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 역할별 접근 가능 범위
    const access: string[] = ['team'];
    if (user.role === 'admin') access.push('manager', 'director', 'admin');
    else if (user.role === 'manager') access.push('manager');
    else if (user.role === 'director') access.push('director');

    return {
      token,
      expiresAt,
      user: {
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        role: user.role,
        access,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.incentiveUser.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();

    // 역할별 접근 가능 범위
    const access: string[] = ['team'];
    if (user.role === 'admin') access.push('manager', 'director', 'admin');
    else if (user.role === 'manager') access.push('manager');
    else if (user.role === 'director') access.push('director');

    return {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      role: user.role,
      access,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.incentiveUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.incentiveUser.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: '비밀번호가 변경되었습니다' };
  }
}
