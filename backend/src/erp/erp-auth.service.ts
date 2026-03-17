import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ErpAuthService {
  constructor(private readonly jwtService: JwtService) {}

  // ERP PIN 검증 — 환경변수 ERP_PIN 기준, 미설정 시 "1234" (개발 기본값)
  validatePin(pin: string): boolean {
    const erpPin = process.env.ERP_PIN ?? '1234';
    return pin === erpPin;
  }

  // JWT 발급 — 24시간 유효
  generateToken(): { token: string; expiresAt: string } {
    const secret = process.env.ERP_JWT_SECRET ?? process.env.JWT_SECRET!;
    const payload = { sub: 'erp', type: 'erp' };
    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn: '24h',
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return { token, expiresAt };
  }

  // JWT 검증 — 유효하면 true, 아니면 false
  verifyToken(token: string): boolean {
    const secret = process.env.ERP_JWT_SECRET ?? process.env.JWT_SECRET!;
    try {
      const payload = this.jwtService.verify(token, { secret });
      return payload?.type === 'erp';
    } catch {
      return false;
    }
  }

  // 로그인 통합 메서드 — PIN 검증 후 토큰 발급
  login(pin: string): { token: string; expiresAt: string } {
    if (!this.validatePin(pin)) {
      throw new UnauthorizedException('PIN이 올바르지 않습니다.');
    }
    return this.generateToken();
  }
}
