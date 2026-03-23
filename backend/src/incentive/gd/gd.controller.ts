import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GdService } from './gd.service';
import { IncentiveJwtGuard, RolesGuard } from '../guards/incentive-auth.guard';
import { Roles } from '../guards/roles.decorator';
import { todayKST } from '../utils/kst';
import { spawn } from 'child_process';

@Controller('incentive/gd')
@UseGuards(IncentiveJwtGuard)
export class GdController {
  private readonly logger = new Logger(GdController.name);

  constructor(private gdService: GdService) {}

  @Get('vehicles')
  searchVehicles(
    @Query('q') q: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.gdService.searchVehicles(q, parseInt(page), parseInt(limit));
  }

  // 기존 path parameter 방식 (하위 호환 유지)
  @Get('vehicles/:code/repairs')
  getVehicleRepairsByPath(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Param('code') code: string,
  ) {
    return this.gdService.getVehicleRepairs(code, parseInt(page), parseInt(limit));
  }

  // 슬래시 등 특수문자 포함 차량코드 대응 — query parameter 방식
  @Get('vehicle-repairs')
  getVehicleRepairs(
    @Query('code') code: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.gdService.getVehicleRepairs(code, parseInt(page), parseInt(limit));
  }

  @Get('products')
  searchProducts(
    @Query('q') q: string = '',
    @Query('category') category: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.gdService.searchProducts(q, parseInt(page), parseInt(limit), category || undefined);
  }

  @Get('customers')
  searchCustomers(
    @Query('q') q: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.gdService.searchCustomers(q, parseInt(page), parseInt(limit));
  }

  // 시재관리 (현금 출납부) - 현금수금 기반 입출금 현황
  // GET /incentive/gd/cash-ledger?startDate=2026-03-01&endDate=2026-03-31
  @Get('cash-ledger')
  getCashLedger(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const today = todayKST();
    const defaultStart = today.slice(0, 7) + '-01';
    const defaultEnd = today;
    return this.gdService.getCashLedger(
      startDate || defaultStart,
      endDate || defaultEnd,
    );
  }

  @Get('daily-revenue')
  getDailyRevenue(@Query('date') date?: string) {
    return this.gdService.getDailyRevenue(date || todayKST());
  }

  @Get('sync-status')
  getSyncStatus() {
    return this.gdService.getSyncStatus();
  }

  // ─── 슬롯 현황 조회 ─────────────────────────────────────────────────────────
  // GET /incentive/gd/slot-status
  @Get('slot-status')
  getSlotStatus() {
    return this.gdService.getSlotStatus();
  }

  // ─── 동기화 수동 트리거 (admin 전용) ─────────────────────────────────────────
  // POST /incentive/gd/trigger-sync
  @Post('trigger-sync')
  @UseGuards(RolesGuard)
  @Roles('admin')
  triggerSync(): Promise<{ message: string }> {
    return new Promise((resolve, reject) => {
      // gd_sync_server.py --trigger 를 subprocess로 실행
      const child = spawn('python3', ['gd_sync_server.py', '--trigger'], {
        cwd: process.env.GD_SYNC_DIR || '/home/ubuntu/dreaming-mech/sync',
        detached: true,
        stdio: 'ignore',
      });

      child.on('error', (err) => {
        this.logger.error(`sync trigger 실패: ${err.message}`);
        reject(new InternalServerErrorException('동기화 트리거 실행 실패'));
      });

      // 프로세스가 정상 스폰되면 즉시 응답 (백그라운드 실행)
      child.unref();

      // 슬롯 캐시 무효화 (새 데이터 반영을 위해)
      this.gdService.invalidateSlotCache();

      this.logger.log('동기화 트리거 요청 수신 → gd_sync_server.py --trigger 실행');
      resolve({ message: '동기화 트리거가 백그라운드에서 시작되었습니다.' });
    });
  }
}
