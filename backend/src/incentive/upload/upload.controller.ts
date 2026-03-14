import {
  Controller, Post, Get, Param, UseGuards, Request,
  UseInterceptors, UploadedFile, Body, ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';

@Controller('incentive/upload')
@UseGuards(IncentiveJwtGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('month') month: string,
    @Body('dataDate') dataDate: string,
    @Request() req: any,
  ) {
    // 모든 인증된 사용자 업로드 가능
    if (!['admin', 'manager', 'director', 'viewer'].includes(req.user.role)) {
      throw new ForbiddenException('업로드 권한이 없습니다');
    }
    return this.uploadService.parseExcel(file.buffer, month, req.user.userId, file.originalname, dataDate);
  }

  @Post('approve/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  approve(@Param('id') id: string, @Request() req: any) {
    return this.uploadService.approve(id, req.user.userId);
  }

  @Get('history')
  getHistory() {
    return this.uploadService.getHistory();
  }
}
