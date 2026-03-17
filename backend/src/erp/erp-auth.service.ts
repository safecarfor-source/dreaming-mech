import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ErpAuthService {
  constructor(private readonly jwtService: JwtService) {}

  // 브루트포스 방지: IP별 시도 횟수 추적
  private loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_MS = 5 * 60 * 1000; // 5분 잠금

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
  login(pin: string, ip?: string): { token: string; expiresAt: string } {
    // 브루트포스 방지
    const clientKey = ip || 'unknown';
    const attempt = this.loginAttempts.get(clientKey);
    if (attempt && attempt.count >= this.MAX_ATTEMPTS) {
      const elapsed = Date.now() - attempt.lastAttempt;
      if (elapsed < this.LOCKOUT_MS) {
        const remainSec = Math.ceil((this.LOCKOUT_MS - elapsed) / 1000);
        throw new UnauthorizedException(`너무 많은 시도입니다. ${remainSec}초 후 다시 시도하세요.`);
      }
      // 잠금 시간 지남 → 초기화
      this.loginAttempts.delete(clientKey);
    }

    const correctPin = process.env.ERP_PIN ?? '1234';
    if (pin !== correctPin) {
      // 실패 횟수 증가
      const current = this.loginAttempts.get(clientKey) || { count: 0, lastAttempt: 0 };
      this.loginAttempts.set(clientKey, { count: current.count + 1, lastAttempt: Date.now() });
      throw new UnauthorizedException('PIN이 올바르지 않습니다.');
    }

    // 성공 시 초기화
    this.loginAttempts.delete(clientKey);

    return this.generateToken();
  }
}
