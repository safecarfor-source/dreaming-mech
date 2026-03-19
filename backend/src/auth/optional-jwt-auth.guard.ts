import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 선택적 JWT 인증 가드
 * 토큰이 있으면 req.user를 채우고, 없으면 req.user = null로 계속 진행
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(_err: any, user: any) {
    // 인증 실패해도 예외 던지지 않고 null 반환
    return user || null;
  }
}
