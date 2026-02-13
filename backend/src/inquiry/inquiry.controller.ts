import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InquiryType } from '@prisma/client';

@Controller('inquiries')
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  // POST /inquiries - 문의 등록 (공개)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body()
    body: {
      type: InquiryType;
      name: string;
      phone: string;
      businessName?: string;
      content: string;
    },
  ) {
    return this.inquiryService.create(body);
  }

  // GET /inquiries - 문의 목록 (관리자)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('type') type?: InquiryType,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inquiryService.findAll({
      type,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  // GET /inquiries/unread-count - 안읽은 문의 수 (관리자)
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount() {
    return this.inquiryService.getUnreadCount();
  }

  // GET /inquiries/:id - 문의 상세 (관리자)
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const inquiry = await this.inquiryService.findOne(id);
    // 조회 시 자동 읽음 처리
    if (!inquiry.isRead) {
      await this.inquiryService.markAsRead(id);
    }
    return inquiry;
  }

  // PATCH /inquiries/:id/reply - 답변 작성 (관리자)
  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard)
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Body('reply') reply: string,
  ) {
    return this.inquiryService.reply(id, reply);
  }

  // DELETE /inquiries/:id - 문의 삭제 (관리자)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inquiryService.remove(id);
  }
}
