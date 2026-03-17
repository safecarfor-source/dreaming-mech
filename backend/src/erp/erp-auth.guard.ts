import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ErpAuthService } from './erp-auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ErpAuthGuard implements CanActivate {
  constructor(
    private readonly erpAuthService: ErpAuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // @Public() 데코레이터가 붙은 엔드포인트는 인증 생략
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('ERP 인증 토큰이 없습니다.');
    }

    const token = authHeader.slice(7); // "Bearer " 이후 추출
    const valid = this.erpAuthService.verifyToken(token);

    if (!valid) {
      throw new UnauthorizedException('ERP 토큰이 유효하지 않거나 만료되었습니다.');
    }

    return true;
  }
}
