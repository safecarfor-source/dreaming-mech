import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IncentiveJwtStrategy extends PassportStrategy(Strategy, 'incentive-jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'incentive-secret',
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.incentiveUser.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException();
    return { userId: user.id, loginId: user.loginId, name: user.name, role: user.role };
  }
}
