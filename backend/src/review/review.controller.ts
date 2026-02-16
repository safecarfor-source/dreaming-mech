import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateReviewSchema } from './schemas/review.schema';
import type { CreateReviewDto } from './schemas/review.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * 리뷰 작성 (공개 - 인증 불필요)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreateReviewSchema))
    dto: CreateReviewDto,
  ) {
    return this.reviewService.create(dto);
  }

  /**
   * 미승인 리뷰 수 (관리자)
   */
  @Get('pending-count')
  @UseGuards(JwtAuthGuard)
  getPendingCount() {
    return this.reviewService.getPendingCount();
  }

  /**
   * 정비소별 승인된 리뷰 (공개)
   */
  @Get('mechanic/:mechanicId')
  findByMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.reviewService.findByMechanic(mechanicId);
  }

  /**
   * 전체 리뷰 목록 (관리자)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('approved') approved?: string,
  ) {
    return this.reviewService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      approved: approved !== undefined ? approved === 'true' : undefined,
    });
  }

  /**
   * 리뷰 승인 (관리자)
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.approve(id);
  }

  /**
   * 리뷰 반려 (관리자)
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.reject(id);
  }

  /**
   * 리뷰 삭제 (관리자)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.remove(id);
  }
}
