import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnifiedInquiryService } from './unified-inquiry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('unified-inquiries')
export class UnifiedInquiryController {
  constructor(
    private readonly service: UnifiedInquiryService,
    private readonly jwtService: JwtService,
  ) {}

  // 통합 목록 (관리자)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 조회할 수 있습니다.');
    }
    return this.service.findAll(Number(page) || 1, Number(limit) || 20);
  }

  // 총 건수 (뱃지용)
  @Get('count')
  @UseGuards(JwtAuthGuard)
  async getCount(@Request() req) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 조회할 수 있습니다.');
    }
    return this.service.getCount();
  }

  // 공개 통계 (인증 불필요 - 공유 링크 페이지용)
  @Get('public-stats')
  async getPublicStats() {
    return this.service.getPublicStats();
  }

  // 상태 변경 (관리자)
  @Patch(':type/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 상태를 변경할 수 있습니다.');
    }
    return this.service.updateStatus(type.toUpperCase(), id, status);
  }

  // 문의 삭제 (관리자)
  @Delete(':type/:id')
  @UseGuards(JwtAuthGuard)
  async deleteInquiry(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 삭제할 수 있습니다.');
    }
    return this.service.delete(type.toUpperCase(), id);
  }

  // 공유 메시지 (관리자)
  @Get(':type/:id/share-message')
  @UseGuards(JwtAuthGuard)
  async getShareMessage(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new BadRequestException('관리자만 조회할 수 있습니다.');
    }
    const message = await this.service.getShareMessage(type.toUpperCase(), id);
    return { message };
  }

  // 공개 상세 조회 (공유 링크 - 역할별 전화번호 제어)
  @Get(':type/:id')
  async findOnePublic(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    // 선택적 인증
    const user = await this.tryGetUser(req);
    // 승인(APPROVED)은 정비소 등록 통제 목적 — 문의 조회는 가입 즉시 허용
    const showPhone = user && (
      user.role === 'admin' ||
      ((user.role === 'user' || user.role === 'owner') &&
        (user.businessStatus === 'APPROVED' || user.businessStatus === 'PENDING'))
    );

    return this.service.findOnePublic(type.toUpperCase(), id, !!showPhone);
  }

  // 선택적 인증 헬퍼
  private async tryGetUser(req: any): Promise<{ sub: number; role: string; businessStatus?: string } | null> {
    try {
      // user_token 또는 admin_token에서 인증 정보 추출 (하위 호환: owner_token도 시도)
      const token = req?.cookies?.user_token || req?.cookies?.owner_token || req?.cookies?.admin_token;
      if (!token) return null;
      const decoded = this.jwtService.verify(token);
      if (!decoded) return null;
      if (decoded.role === 'user' || decoded.role === 'owner') {
        const userData = await this.service.getOwnerStatus(decoded.sub);
        return { ...decoded, businessStatus: userData?.businessStatus };
      }
      return decoded;
    } catch {
      return null;
    }
  }
}
