import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OwnerApprovedGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.role !== 'owner') {
      return false;
    }

    const owner = await this.prisma.owner.findUnique({
      where: { id: user.sub },
      select: { status: true },
    });

    if (!owner || owner.status !== 'APPROVED') {
      throw new ForbiddenException('승인된 사장님만 이용할 수 있습니다.');
    }

    return true;
  }
}
