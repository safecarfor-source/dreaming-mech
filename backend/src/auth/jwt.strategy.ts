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
          // 관리자 전용 경로
          if (path.startsWith('/admin')) {
            return req?.cookies?.admin_token || null;
          }
          // 나머지 모든 경로는 user_token 사용 (하위 호환: owner_token, customer_token도 시도)
          return (
            req?.cookies?.user_token ||
            req?.cookies?.admin_token ||
            null
          );
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
