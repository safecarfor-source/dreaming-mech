import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * YouTube Supporter 전용 비밀번호 인증 가드
 * 쿠키(yt_token) 또는 Authorization 헤더에서 토큰 확인
 * 환경변수 YT_PASSWORD와 비교
 */
@Injectable()
export class YtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('인증이 필요합니다');
    }

    const expectedPassword = process.env.YT_PASSWORD;
    if (!expectedPassword) {
      // 환경변수 미설정 시 개발 편의를 위해 통과 (개발 환경)
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('서버 설정 오류: YT_PASSWORD가 설정되지 않았습니다');
      }
      return true;
    }

    if (token !== expectedPassword) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    // 1순위: 쿠키에서 확인
    const cookieToken = request.cookies?.['yt_token'] as string | undefined;
    if (cookieToken) {
      return cookieToken;
    }

    // 2순위: Authorization 헤더 (Bearer 토큰)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // 3순위: x-yt-token 헤더
    const headerToken = request.headers['x-yt-token'] as string | undefined;
    if (headerToken) {
      return headerToken;
    }

    return undefined;
  }
}
