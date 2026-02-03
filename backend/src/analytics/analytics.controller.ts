import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Ip,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BotDetectionGuard } from '../common/guards/bot-detection.guard';

@Controller('analytics')
@SkipThrottle() // 통계 API는 Rate Limit 제외
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // POST /analytics/pageview - PageView 기록 (인증 불필요)
  @Post('pageview')
  @UseGuards(BotDetectionGuard)
  trackPageView(
    @Body('path') path: string,
    @Body('referer') referer: string | undefined,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req['userAgent'] as string;
    const isBot = req['isBot'] as boolean;

    return this.analyticsService.trackPageView(
      path,
      ip,
      userAgent,
      isBot,
      referer,
    );
  }

  // GET /analytics/site-stats - 사이트 전체 통계 (JWT 필수)
  @Get('site-stats')
  @UseGuards(JwtAuthGuard)
  getSiteStats(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : undefined;
    return this.analyticsService.getSiteStats(daysNum);
  }

  // GET /analytics/mechanic/:id/monthly - 정비사별 월별 클릭 (JWT 필수)
  @Get('mechanic/:id/monthly')
  @UseGuards(JwtAuthGuard)
  getMechanicMonthlyClicks(
    @Param('id', ParseIntPipe) id: number,
    @Query('months') months?: string,
  ) {
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.analyticsService.getMechanicMonthlyClicks(id, monthsNum);
  }

  // GET /analytics/all-mechanics-monthly - 전체 정비사 월별 클릭 (JWT 필수)
  @Get('all-mechanics-monthly')
  @UseGuards(JwtAuthGuard)
  getAllMechanicsMonthlyClicks(@Query('months') months?: string) {
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.analyticsService.getAllMechanicsMonthlyClicks(monthsNum);
  }

  // GET /analytics/top-mechanics - 기간별 인기 정비사 TOP N (JWT 필수)
  @Get('top-mechanics')
  @UseGuards(JwtAuthGuard)
  getTopMechanics(
    @Query('period') period: 'realtime' | 'daily' | 'monthly' = 'realtime',
    @Query('limit') limit?: string,
    @Query('days') days?: string,
    @Query('months') months?: string,
  ) {
    // parseInt 및 범위 검증
    const limitNum = Math.min(Math.max(1, limit ? parseInt(limit, 10) : 5), 100);
    const daysNum = Math.min(Math.max(1, days ? parseInt(days, 10) : 7), 365);
    const monthsNum = Math.min(Math.max(1, months ? parseInt(months, 10) : 6), 60);

    // NaN 체크
    if (isNaN(limitNum) || isNaN(daysNum) || isNaN(monthsNum)) {
      throw new BadRequestException('Invalid query parameters');
    }

    return this.analyticsService.getTopMechanics(
      period,
      limitNum,
      daysNum,
      monthsNum,
    );
  }
}
