import {
  Controller, Post, Get, Param, UseGuards, Request,
  UseInterceptors, UploadedFile, Body, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';
import * as path from 'path';

@Controller('incentive/upload')
@UseGuards(IncentiveJwtGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('month') month: string,
    @Body('dataDate') dataDate: string,
    @Request() req: any,
  ) {
    if (!['admin', 'manager', 'director'].includes(req.user.role)) {
      throw new ForbiddenException('업로드 권한이 없습니다');
    }
    if (!file) {
      throw new BadRequestException('파일이 없습니다');
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx') {
      throw new BadRequestException('.xlsx 파일만 업로드 가능합니다');
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
