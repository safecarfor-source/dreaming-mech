import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UsePipes,
  Request,
} from '@nestjs/common';
import { TrackingLinkService } from './tracking-link.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateTrackingLinkSchema,
  type CreateTrackingLinkDto,
  UpdateTrackingLinkSchema,
  type UpdateTrackingLinkDto,
  RecordClickSchema,
  type RecordClickDto,
} from './dto/tracking-link.dto';

@Controller('tracking-links')
export class TrackingLinkController {
  constructor(private readonly trackingLinkService: TrackingLinkService) {}

  // ── 관리자 전용 엔드포인트 ──

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(CreateTrackingLinkSchema))
  async create(@Body() dto: CreateTrackingLinkDto) {
    const link = await this.trackingLinkService.create(dto);
    return {
      success: true,
      data: link,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const links = await this.trackingLinkService.findAll();
    return {
      success: true,
      data: links,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const link = await this.trackingLinkService.findOne(id);
    return {
      success: true,
      data: link,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateTrackingLinkSchema)) dto: UpdateTrackingLinkDto,
  ) {
    const link = await this.trackingLinkService.update(id, dto);
    return {
      success: true,
      data: link,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.trackingLinkService.remove(id);
    return {
      success: true,
      data: result,
    };
  }

  // ── 공개 엔드포인트 (인증 불필요) ──

  // POST /tracking-links/click — 클릭 기록
  // 주의: NestJS 라우터는 선언 순서대로 매칭하므로 :id 보다 앞에 위치해야 함
  @Post('click')
  @UsePipes(new ZodValidationPipe(RecordClickSchema))
  async recordClick(@Body() dto: RecordClickDto, @Request() req) {
    // x-forwarded-for 헤더 우선, 없으면 req.ip 사용
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? req.ip ?? '';
    const userAgent = (req.headers['user-agent'] as string) || '';

    try {
      const result = await this.trackingLinkService.recordClick(dto.code, ip, userAgent);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // 추적 실패가 사용자 경험에 영향을 주면 안 되므로 항상 200 반환
      this.trackingLinkService.logClickError(error, dto.code);
      return {
        success: false,
        data: { recorded: false, reason: 'error' },
      };
    }
  }
}
