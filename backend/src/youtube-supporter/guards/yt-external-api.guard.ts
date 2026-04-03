import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * 외부 연동(클로드 앱 등) 전용 API 키 인증 가드
 * x-api-key 헤더 또는 Authorization: ApiKey <key> 형식 지원
 * 환경변수 YT_EXTERNAL_API_KEY와 비교
 */
@Injectable()
export class YtExternalApiGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API 키가 필요합니다');
    }

    const expectedKey = process.env.YT_EXTERNAL_API_KEY;
    if (!expectedKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('서버 설정 오류: YT_EXTERNAL_API_KEY가 설정되지 않았습니다');
      }
      // 개발 환경: 키 미설정 시 통과
      return true;
    }

    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('유효하지 않은 API 키입니다');
    }

    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    // 1순위: x-api-key 헤더
    const xApiKey = request.headers['x-api-key'] as string | undefined;
    if (xApiKey) return xApiKey;

    // 2순위: Authorization: ApiKey <key>
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('ApiKey ')) {
      return authHeader.slice(7);
    }

    return undefined;
  }
}
