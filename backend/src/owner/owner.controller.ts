import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OwnerService } from './owner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { BusinessApprovedGuard } from '../auth/guards/owner-approved.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateMechanicSchema,
  UpdateMechanicSchema,
  type CreateMechanicDto,
  type UpdateMechanicDto,
} from '../mechanic/schemas/mechanic.schema';

// ── 관리자용: 사용자 관리 ──

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOwnerController {
  constructor(private ownerService: OwnerService) {}

  @Get()
  findAll(@Query('businessStatus') status?: string) {
    return this.ownerService.findAll(status);
  }

  // GET /admin/users/pending-approval — 사업자등록증 미승인 유저 목록
  @Get('pending-approval')
  getPendingApproval() {
    return this.ownerService.getPendingApprovalUsers();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.findOne(id);
  }

  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.approve(id);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ) {
    return this.ownerService.reject(id, body.reason);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.deactivateOwner(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.reactivateOwner(id);
  }

  @Patch(':id/toggle-protected')
  toggleProtected(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.toggleProtected(id);
  }

  // 사용자 강제 탈퇴 (DELETE /admin/users/:id)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.ownerService.deleteCustomer(id);
  }
}

// ── 사장님용: 사업자등록증 제출 + 재신청 ──

@Controller('owner')
@UseGuards(JwtAuthGuard)
export class OwnerProfileController {
  constructor(private ownerService: OwnerService) {}

  // GET /owner/profile — user_token으로 사장님 프로필 반환
  @Get('profile')
  getProfile(@Request() req) {
    return this.ownerService.getProfile(req.user.sub);
  }

  // PATCH /owner/profile — 전화번호 등 프로필 업데이트
  @Patch('profile')
  updateProfile(
    @Request() req,
    @Body() body: { phone?: string; businessName?: string; address?: string; name?: string },
  ) {
    return this.ownerService.updateProfile(req.user.sub, body);
  }

  // GET /owner/report?period=YYYY-Www — 주간 성과 리포트
  @Get('report')
  getWeeklyReport(
    @Request() req,
    @Query('period') period?: string,
  ) {
    return this.ownerService.getWeeklyReport(req.user.sub, period);
  }

  // GET /owner/service-inquiries — 내 정비소 선택 고객 문의 목록
  @Get('service-inquiries')
  getMyInquiries(@Request() req) {
    return this.ownerService.getMyInquiries(req.user.sub);
  }

  // GET /owner/service-inquiries/:id — 문의 상세
  @Get('service-inquiries/:id')
  getMyInquiryDetail(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ownerService.getMyInquiryDetail(req.user.sub, id);
  }

  @Post('business-license')
  submitBusinessLicense(
    @Request() req,
    @Body() body: { businessLicenseUrl: string; businessName: string },
  ) {
    return this.ownerService.submitBusinessLicense(
      req.user.sub,
      body.businessLicenseUrl,
      body.businessName,
    );
  }

  @Post('reapply')
  reapply(
    @Request() req,
    @Body() body: { businessLicenseUrl: string; businessName: string; nickname?: string; phone?: string; address?: string },
  ) {
    return this.ownerService.reapply(req.user.sub, body);
  }

  // POST /owner/business-info — 사업자 정보 통합 제출 (이름/전화/주소/상호/사업자등록증)
  @Post('business-info')
  submitBusinessInfo(
    @Request() req,
    @Body()
    body: {
      name: string;
      phone: string;
      address: string;
      businessName: string;
      businessLicenseUrl: string;
    },
  ) {
    return this.ownerService.submitBusinessInfo(req.user.sub, body);
  }

  // PATCH /owner/signup-inquiry — 가입 문의 ID 기록 (최초 1회만 저장, 공유 링크 추적용)
  @Patch('signup-inquiry')
  setSignupInquiry(
    @Request() req,
    @Body() body: { inquiryId: number },
  ) {
    return this.ownerService.setSignupInquiry(req.user.sub, body.inquiryId);
  }
}

// ── 사용자용: 매장 관리 ──

@Controller('owner/mechanics')
@UseGuards(JwtAuthGuard, BusinessApprovedGuard)
export class OwnerMechanicController {
  constructor(private ownerService: OwnerService) {}

  @Get()
  getMyMechanics(@Request() req) {
    return this.ownerService.getMyMechanics(req.user.sub);
  }

  @Post()
  create(
    @Request() req,
    @Body(new ZodValidationPipe(CreateMechanicSchema)) data: CreateMechanicDto,
  ) {
    return this.ownerService.createMechanic(req.user.sub, data);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateMechanicSchema)) data: UpdateMechanicDto,
  ) {
    return this.ownerService.updateMechanic(req.user.sub, id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ownerService.removeMechanic(req.user.sub, id);
  }
}

// ── 관리자용: 배지 통합 조회 ──

@Controller('admin/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminBadgeController {
  constructor(private ownerService: OwnerService) {}

  @Get()
  getBadges() {
    return this.ownerService.getAdminBadges();
  }
}

// ── 관리자용: 정비소별 리포트 + 공유 토큰 발급 ──

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminReportController {
  constructor(private ownerService: OwnerService) {}

  // GET /admin/reports/mechanic/:mechanicId?period=YYYY-Www
  @Get('mechanic/:mechanicId')
  getReportByMechanic(
    @Param('mechanicId', ParseIntPipe) mechanicId: number,
    @Query('period') period?: string,
  ) {
    return this.ownerService.getWeeklyReportByMechanicId(mechanicId, period);
  }

  // POST /admin/reports/mechanic/:mechanicId/share-token
  @Post('mechanic/:mechanicId/share-token')
  generateShareToken(
    @Param('mechanicId', ParseIntPipe) mechanicId: number,
  ) {
    return this.ownerService.generateReportShareToken(mechanicId);
  }
}

// ── 공개용: 공유 토큰으로 리포트 열람 (인증 불필요) ──

@Controller('public/report')
export class PublicReportController {
  constructor(private ownerService: OwnerService) {}

  // GET /public/report/:token?period=YYYY-Www
  @Get(':token')
  getReport(
    @Param('token') token: string,
    @Query('period') period?: string,
  ) {
    const { mechanicId } = this.ownerService.verifyReportShareToken(token);
    return this.ownerService.getWeeklyReportByMechanicId(mechanicId, period);
  }
}
