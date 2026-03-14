import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

// JWT 인증 가드
@Injectable()
export class IncentiveJwtGuard extends AuthGuard('incentive-jwt') {}

// 역할 기반 가드
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('인증 필요');

    if (!roles.includes(user.role)) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }
    return true;
  }
}

// 본인 + 관리자만 접근 가드
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetRole = request.params.role || request.query.role;

    if (!user) throw new ForbiddenException('인증 필요');
    if (user.role === 'admin') return true;
    if (targetRole && user.role !== targetRole) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }
    return true;
  }
}
