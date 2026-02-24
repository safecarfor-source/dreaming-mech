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
import { JwtService } from '@nestjs/jwt';
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
  constructor(
    private readonly serviceInquiryService: ServiceInquiryService,
    private readonly jwtService: JwtService,
  ) {}

  // 문의 접수 (비로그인 허용)
  @Post()
  @UsePipes(new ZodValidationPipe(CreateServiceInquirySchema))
  async create(@Body() dto: CreateServiceInquiryDto) {
    return this.serviceInquiryService.create(dto);
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

  // 상세 조회 (로그인 상태에 따라 전화번호 공개/블러)
  @Get(':id')
  async findOnePublic(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // 쿠키에서 토큰 확인 (선택적 인증)
    const user = await this.tryGetUser(req);

    // APPROVED Owner 또는 Admin이면 전화번호 포함
    if (
      user &&
      (user.role === 'admin' ||
        (user.role === 'owner' && user.status === 'APPROVED'))
    ) {
      return this.serviceInquiryService.findOne(id);
    }

    // 그 외: 전화번호 블러 처리
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

  // 공유 메시지 생성 (관리자)
  @Get(':id/share-message')
  @UseGuards(JwtAuthGuard)
  async getShareMessage(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 공유 메시지를 생성할 수 있습니다.');
    }

    const message = await this.serviceInquiryService.getShareMessage(id);
    return { message };
  }

  // 선택적 인증 - 쿠키에서 토큰 추출 및 검증
  private async tryGetUser(
    req: any,
  ): Promise<{ sub: number; role: string; status?: string } | null> {
    try {
      // owner_token 또는 admin_token에서 인증 정보 추출
      const token = req?.cookies?.owner_token || req?.cookies?.admin_token;
      if (!token) return null;

      const decoded = this.jwtService.verify(token);
      if (!decoded) return null;

      // owner인 경우 status 확인
      if (decoded.role === 'owner') {
        const owner = await this.serviceInquiryService.getOwnerStatus(
          decoded.sub,
        );
        return { ...decoded, status: owner?.status };
      }

      return decoded;
    } catch {
      return null;
    }
  }
}
