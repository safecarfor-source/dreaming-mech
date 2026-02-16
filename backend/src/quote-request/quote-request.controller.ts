import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { QuoteRequestService } from './quote-request.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateQuoteRequestSchema,
  UpdateQuoteRequestStatusSchema,
} from './schemas/quote-request.schema';
import type {
  CreateQuoteRequestDto,
  UpdateQuoteRequestStatusDto,
} from './schemas/quote-request.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quote-requests')
export class QuoteRequestController {
  constructor(private readonly quoteRequestService: QuoteRequestService) {}

  /**
   * 견적 요청 생성 (공개 - 인증 불필요)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreateQuoteRequestSchema))
    dto: CreateQuoteRequestDto,
  ) {
    return this.quoteRequestService.create(dto);
  }

  /**
   * 미확인 견적 요청 수 (관리자)
   */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount() {
    return this.quoteRequestService.getUnreadCount();
  }

  /**
   * 전체 견적 요청 목록 (관리자)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.quoteRequestService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
    });
  }

  /**
   * 정비소별 견적 요청 목록 (사장님)
   */
  @Get('mechanic/:mechanicId')
  @UseGuards(JwtAuthGuard)
  findByMechanic(
    @Param('mechanicId', ParseIntPipe) mechanicId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.quoteRequestService.findByMechanic(mechanicId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  /**
   * 견적 요청 상세 (관리자/사장님)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quoteRequestService.findOne(id);
  }

  /**
   * 견적 요청 상태 변경 (관리자/사장님)
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateQuoteRequestStatusSchema))
    dto: UpdateQuoteRequestStatusDto,
  ) {
    return this.quoteRequestService.updateStatus(id, dto);
  }
}
