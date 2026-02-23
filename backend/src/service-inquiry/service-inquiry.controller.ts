import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { ServiceInquiryService } from './service-inquiry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateServiceInquirySchema,
  type CreateServiceInquiryDto,
} from './dto/create-service-inquiry.dto';
import { ServiceInquiryStatus } from '@prisma/client';

@Controller('service-inquiries')
export class ServiceInquiryController {
  constructor(private readonly serviceInquiryService: ServiceInquiryService) {}

  // 문의 접수 (고객 인증 필요)
  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(CreateServiceInquirySchema))
  async create(@Body() dto: CreateServiceInquiryDto, @Request() req) {
    if (req.user.role !== 'customer') {
      throw new BadRequestException('고객만 문의를 접수할 수 있습니다.');
    }

    return this.serviceInquiryService.create(dto, req.user.sub);
  }

  // 목록 조회 (관리자)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 목록을 조회할 수 있습니다.');
    }

    return this.serviceInquiryService.findAll(page, limit);
  }

  // 공개 상세 조회 (전화번호 제외)
  @Get(':id')
  async findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.serviceInquiryService.findOnePublic(id);
  }

  // 전체 상세 조회 (관리자, 전화번호 포함)
  @Get(':id/full')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 전체 정보를 조회할 수 있습니다.');
    }

    return this.serviceInquiryService.findOne(id);
  }

  // 상태 업데이트 (관리자)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ServiceInquiryStatus,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 상태를 변경할 수 있습니다.');
    }

    if (!Object.values(ServiceInquiryStatus).includes(status)) {
      throw new BadRequestException('유효하지 않은 상태값입니다.');
    }

    return this.serviceInquiryService.updateStatus(id, status);
  }
}
