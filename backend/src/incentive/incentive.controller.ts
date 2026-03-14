import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
} from '@nestjs/common';
import { IncentiveService } from './incentive.service';
import { SaveIncentiveDto } from './dto/save-incentive.dto';

@Controller('incentive')
export class IncentiveController {
  constructor(private readonly incentiveService: IncentiveService) {}

  // 전체 데이터 조회
  @Get('data')
  findAll(@Query('month') month?: string) {
    if (month) return this.incentiveService.findByMonth(month);
    return this.incentiveService.findAll();
  }

  // 월별 데이터 저장
  @Post('data')
  save(@Body() dto: SaveIncentiveDto) {
    return this.incentiveService.save(dto);
  }

  // 전체 데이터 일괄 저장 (초기 이관용)
  @Post('data/bulk')
  saveAll(@Body() data: Record<string, Record<string, { sales: number; qty: number }>>) {
    return this.incentiveService.saveAll(data);
  }

  // 월 삭제
  @Delete('data')
  deleteMonth(@Query('month') month: string) {
    return this.incentiveService.deleteMonth(month);
  }
}
