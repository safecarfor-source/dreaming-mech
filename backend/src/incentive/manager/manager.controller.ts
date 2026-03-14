import { Controller, Get, Query, UseGuards, ForbiddenException, Request } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { IncentiveJwtGuard } from '../guards/incentive-auth.guard';

@Controller('incentive/manager')
@UseGuards(IncentiveJwtGuard)
export class ManagerController {
  constructor(private managerService: ManagerService) {}

  @Get('current')
  getCurrent(@Request() req: any, @Query('month') month?: string) {
    this.checkAccess(req.user);
    return this.managerService.getCurrent(month);
  }

  @Get('monthly')
  getMonthly(@Request() req: any) {
    this.checkAccess(req.user);
    return this.managerService.getMonthly();
  }

  private checkAccess(user: any) {
    if (user.role !== 'admin' && user.role !== 'manager') {
      throw new ForbiddenException('접근 권한이 없습니다');
    }
  }
}
