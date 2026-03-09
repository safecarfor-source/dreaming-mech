import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusinessApprovedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== 'user') {
      return false;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { businessStatus: true },
    });

    if (!dbUser || dbUser.businessStatus !== 'APPROVED') {
      throw new ForbiddenException('사업자 승인이 필요합니다.');
    }

    return true;
  }
}

// 하위 호환을 위해 기존 이름도 export
export { BusinessApprovedGuard as OwnerApprovedGuard };
