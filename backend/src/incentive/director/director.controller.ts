import { Controller, Get, Query, UseGuards, ForbiddenException, Request } from '@nestjs/common';
import { DirectorService } from './director.service';
import { IncentiveJwtGuard } from '../guards/incentive-auth.guard';

@Controller('incentive/director')
@UseGuards(IncentiveJwtGuard)
export class DirectorController {
  constructor(private directorService: DirectorService) {}

  @Get('current')
  getCurrent(@Request() req: any, @Query('month') month?: string) {
    this.checkAccess(req.user);
    return this.directorService.getCurrent(month);
  }

  @Get('monthly')
  getMonthly(@Request() req: any) {
    this.checkAccess(req.user);
    return this.directorService.getMonthly();
  }

  private checkAccess(user: any) {
    if (user.role !== 'admin' && user.role !== 'director') {
      throw new ForbiddenException('접근 권한이 없습니다');
    }
  }
}
