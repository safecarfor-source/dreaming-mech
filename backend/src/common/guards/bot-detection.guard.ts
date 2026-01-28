import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class BotDetectionGuard implements CanActivate {
  private readonly botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java(?!script)/i,
    /go-http-client/i,
    /apache-httpclient/i,
    /okhttp/i,
    /axios/i,
    /node-fetch/i,
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /sogou/i,
    /exabot/i,
    /facebookexternalhit/i,
    /facebot/i,
    /ia_archiver/i,
    /mj12bot/i,
    /dotbot/i,
    /ahrefsbot/i,
    /semrushbot/i,
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userAgent = request.headers['user-agent'];

    // User-Agent가 없으면 거부
    if (!userAgent) {
      throw new BadRequestException('User-Agent header is required');
    }

    // User-Agent를 request 객체에 추가
    request['userAgent'] = userAgent;

    // 봇 감지
    const isBot = this.detectBot(userAgent);
    request['isBot'] = isBot;

    return true;
  }

  detectBot(userAgent: string): boolean {
    // 패턴 매칭으로 봇 감지
    for (const pattern of this.botPatterns) {
      if (pattern.test(userAgent)) {
        return true;
      }
    }

    // UAParser로 추가 검증
    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      // 브라우저가 없거나 OS가 없으면 봇일 가능성이 높음
      if (!result.browser.name || !result.os.name) {
        return true;
      }

      // 엔진이 없으면 봇일 가능성이 높음
      if (!result.engine.name) {
        return true;
      }
    } catch (error) {
      // 파싱 실패 시 봇으로 간주
      return true;
    }

    return false;
  }
}
