import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 요청 경로에 따라 적절한 쿠키 선택
        (req: Request) => {
          const path = req?.path || '';
          if (path.startsWith('/admin')) {
            return req?.cookies?.admin_token || null;
          }
          if (path.startsWith('/owner')) {
            return req?.cookies?.owner_token || null;
          }
          // auth/profile 등 공통 경로는 둘 다 시도
          return req?.cookies?.admin_token || req?.cookies?.owner_token || null;
        },
        // Fallback to Authorization header for backwards compatibility
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role || 'admin', // 기존 토큰 하위호환
    };
  }
}
