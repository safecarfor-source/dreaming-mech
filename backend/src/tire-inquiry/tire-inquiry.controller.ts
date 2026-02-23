import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { TireInquiryService } from './tire-inquiry.service';
import { CreateTireInquirySchema, UpdateTireInquiryStatusSchema } from './schemas/tire-inquiry.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('tire-inquiries')
export class TireInquiryController {
  constructor(private readonly tireInquiryService: TireInquiryService) {}

  // 공개: 타이어 문의 생성
  @Post()
  async create(@Body(new ZodValidationPipe(CreateTireInquirySchema)) body: any) {
    return this.tireInquiryService.create(body);
  }

  // 관리자: 미확인 건수
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount() {
    const count = await this.tireInquiryService.getUnreadCount();
    return { count };
  }

  // 관리자: 전체 목록
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('region') region?: string,
  ) {
    return this.tireInquiryService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      region,
    });
  }

  // 관리자: 상세 조회
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const inquiry = await this.tireInquiryService.findOne(id);
    if (!inquiry) throw new NotFoundException('타이어 문의를 찾을 수 없습니다');
    return inquiry;
  }

  // 관리자: 상태 변경
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateTireInquiryStatusSchema)) body: any,
  ) {
    const { status, adminNote } = body;
    return this.tireInquiryService.updateStatus(id, status, adminNote);
  }

  // 관리자: 삭제
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.tireInquiryService.delete(id);
  }
}
