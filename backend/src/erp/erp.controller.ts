/**
 * ERP 컨트롤러
 * /erp/* 엔드포인트 정의
 *
 * 인증: ErpAuthGuard (PIN 기반 JWT) — /erp/auth/* 는 @Public() 으로 제외
 */

import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Param,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ErpService } from './erp.service';
import { ErpAuthService } from './erp-auth.service';
import { ErpAuthGuard } from './erp-auth.guard';
import { Public } from './public.decorator';
import {
  DateRangeQuerySchema,
  CustomerQuerySchema,
  ReminderQuerySchema,
  TopProductsQuerySchema,
  CreateVehicleSchema,
  CreateSaleSchema,
  CreateRepairSchema,
} from './dto/erp-query.dto';

@Controller('erp')
@UseGuards(ErpAuthGuard)
export class ErpController {
  constructor(
    private readonly erpService: ErpService,
    private readonly erpAuthService: ErpAuthService,
  ) {}

  // ----------------------------------------
  // POST /erp/auth/login
  // PIN 검증 후 JWT 발급
  // ----------------------------------------
  @Public()
  @Post('auth/login')
  login(@Body() body: { pin: string }, @Headers('x-forwarded-for') xff?: string, @Headers('x-real-ip') realIp?: string) {
    if (!body?.pin || typeof body.pin !== 'string') {
      throw new BadRequestException('PIN이 필요합니다.');
    }
    const ip = xff?.split(',')[0]?.trim() || realIp || 'unknown';
    return this.erpAuthService.login(body.pin, ip);
  }

  // ----------------------------------------
  // GET /erp/auth/verify
  // Authorization 헤더 토큰 유효성 확인
  // ----------------------------------------
  @Public()
  @Get('auth/verify')
  verify(@Headers('authorization') authHeader: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false };
    }
    const token = authHeader.slice(7);
    const valid = this.erpAuthService.verifyToken(token);
    return { valid };
  }

  // ----------------------------------------
  // GET /erp/dashboard
  // 오늘 매출, 월 누적, 전년비 대시보드
  // ----------------------------------------
  @Get('dashboard')
  async getDashboard() {
    return this.erpService.getDashboard();
  }

  // ----------------------------------------
  // GET /erp/sales/daily?from=2026-03-01&to=2026-03-17
  // 일별 매출 집계
  // ----------------------------------------
  @Get('sales/daily')
  async getDailySales(@Query() rawQuery: Record<string, string>) {
    const result = DateRangeQuerySchema.safeParse(rawQuery);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return this.erpService.getDailySales(result.data);
  }

  // ----------------------------------------
  // GET /erp/sales/category?from=&to=
  // 카테고리별 매출 (타이어, 오일, 배터리 등)
  // ----------------------------------------
  @Get('sales/category')
  async getSalesByCategory(@Query() rawQuery: Record<string, string>) {
    const result = DateRangeQuerySchema.safeParse(rawQuery);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return this.erpService.getSalesByCategory(result.data);
  }

  // ----------------------------------------
  // GET /erp/customers?q=검색어&page=1&limit=20
  // 고객/차량 검색
  // ----------------------------------------
  @Get('customers')
  async searchCustomers(@Query() rawQuery: Record<string, string>) {
    const result = CustomerQuerySchema.safeParse(rawQuery);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return this.erpService.searchCustomers(result.data);
  }

  // ----------------------------------------
  // GET /erp/customers/:code/detail
  // 고객 상세 (차량 정보 + 정비 이력 + 리마인더)
  // ----------------------------------------
  @Get('customers/:code/detail')
  async getCustomerDetail(@Param('code') code: string) {
    if (!code || code.trim().length === 0) {
      throw new BadRequestException('차량 코드가 필요합니다.');
    }
    return this.erpService.getCustomerDetail(code.trim());
  }

  // ----------------------------------------
  // GET /erp/customers/:code/predict
  // 다음 방문 예측 (오일교환, 타이어교체, 검사)
  // ----------------------------------------
  @Get('customers/:code/predict')
  async predictNextVisit(@Param('code') code: string) {
    if (!code || code.trim().length === 0) {
      throw new BadRequestException('차량 코드가 필요합니다.');
    }
    return this.erpService.predictNextVisit(code.trim());
  }

  // ----------------------------------------
  // GET /erp/reminders?status=pending&page=1&limit=20
  // 리마인더 목록 조회
  // ----------------------------------------
  @Get('reminders')
  async getReminders(@Query() rawQuery: Record<string, string>) {
    const result = ReminderQuerySchema.safeParse(rawQuery);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return this.erpService.getReminders(result.data);
  }

  // ----------------------------------------
  // POST /erp/reminders/generate
  // 리마인더 자동 생성 (배치 스캔)
  // ----------------------------------------
  @Post('reminders/generate')
  async generateReminders() {
    return this.erpService.generateReminders();
  }

  // ----------------------------------------
  // GET /erp/products/search?q=검색어
  // 상품 검색 (등록 폼에서 사용)
  // ----------------------------------------
  @Get('products/search')
  async searchProducts(@Query('q') q: string = '') {
    return this.erpService.searchProducts(q);
  }

  // ----------------------------------------
  // GET /erp/products/top?from=&to=&limit=10
  // 상위 판매 상품
  // ----------------------------------------
  @Get('products/top')
  async getTopProducts(@Query() rawQuery: Record<string, string>) {
    const result = TopProductsQuerySchema.safeParse(rawQuery);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return this.erpService.getTopProducts(result.data);
  }

  // ----------------------------------------
  // POST /erp/customers
  // 신규 고객/차량 등록
  // ----------------------------------------
  @Post('customers')
  async createVehicle(@Body() body: any) {
    const result = CreateVehicleSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return this.erpService.createVehicle(result.data);
  }

  // ----------------------------------------
  // POST /erp/sales
  // 매출/매입 등록
  // ----------------------------------------
  @Post('sales')
  async createSale(@Body() body: any) {
    const result = CreateSaleSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return this.erpService.createSale(result.data);
  }

  // ----------------------------------------
  // POST /erp/repairs
  // 정비 등록
  // ----------------------------------------
  @Post('repairs')
  async createRepair(@Body() body: any) {
    const result = CreateRepairSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten().fieldErrors);
    }
    return this.erpService.createRepair(result.data);
  }

  // ----------------------------------------
  // GET /erp/sync-status
  // 동기화 상태 조회
  // ----------------------------------------
  @Get('sync-status')
  async getSyncStatus() {
    return this.erpService.getSyncStatus();
  }
}
