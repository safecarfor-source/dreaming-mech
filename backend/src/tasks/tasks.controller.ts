import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { AutoCleanupService } from './auto-cleanup.service';

/**
 * GET /admin/cleanup/preview
 * 자동탈퇴 예정 유저 미리보기 (관리자 전용)
 */
@Controller('admin/cleanup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class TasksController {
  constructor(private readonly autoCleanupService: AutoCleanupService) {}

  @Get('preview')
  getCleanupPreview() {
    return this.autoCleanupService.getCleanupPreview();
  }
}
