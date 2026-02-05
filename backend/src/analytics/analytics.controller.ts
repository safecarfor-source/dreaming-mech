import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Ip,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BotDetectionGuard } from '../common/guards/bot-detection.guard';
import { RangeValidationPipe } from '../common/pipes/range-validation.pipe';
import { ANALYTICS_DEFAULTS } from '../common/constants/analytics.constants';

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
  getSiteStats(
    @Query(
      'days',
      new DefaultValuePipe(ANALYTICS_DEFAULTS.DAYS_DEFAULT),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(1, 365),
    )
    days?: number,
  ) {
    return this.analyticsService.getSiteStats(days);
  }

  // GET /analytics/site-stats-by-month - 특정 월의 일별 통계 (JWT 필수)
  @Get('site-stats-by-month')
  @UseGuards(JwtAuthGuard)
  getSiteStatsByMonth(
    @Query(
      'year',
      new DefaultValuePipe(new Date().getFullYear()),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(2020, 2100),
    )
    year?: number,
    @Query(
      'month',
      new DefaultValuePipe(new Date().getMonth() + 1),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(1, 12),
    )
    month?: number,
  ) {
    return this.analyticsService.getSiteStatsByMonth(year!, month!);
  }

  // GET /analytics/site-stats-monthly - 사이트 월별 통계 (JWT 필수)
  @Get('site-stats-monthly')
  @UseGuards(JwtAuthGuard)
  getSiteMonthlyStats(
    @Query(
      'months',
      new DefaultValuePipe(ANALYTICS_DEFAULTS.MONTHS_DEFAULT),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(1, 60),
    )
    months?: number,
  ) {
    return this.analyticsService.getSiteMonthlyStats(months);
  }

  // GET /analytics/mechanic/:id/monthly - 정비사별 월별 클릭 (JWT 필수)
  @Get('mechanic/:id/monthly')
  @UseGuards(JwtAuthGuard)
  getMechanicMonthlyClicks(
    @Param('id', ParseIntPipe) id: number,
    @Query(
      'months',
      new DefaultValuePipe(6),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(1, 60),
    )
    months?: number,
  ) {
    return this.analyticsService.getMechanicMonthlyClicks(id, months);
  }

  // GET /analytics/all-mechanics-monthly - 전체 정비사 월별 클릭 (JWT 필수)
  @Get('all-mechanics-monthly')
  @UseGuards(JwtAuthGuard)
  getAllMechanicsMonthlyClicks(
    @Query(
      'months',
      new DefaultValuePipe(6),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(1, 60),
    )
    months?: number,
  ) {
    return this.analyticsService.getAllMechanicsMonthlyClicks(months);
  }

  // GET /analytics/top-mechanics-by-month - 특정 월의 인기 정비사 TOP N (JWT 필수)
  @Get('top-mechanics-by-month')
  @UseGuards(JwtAuthGuard)
  getTopMechanicsByMonth(
    @Query(
      'year',
      new DefaultValuePipe(new Date().getFullYear()),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(2020, 2100),
    )
    year?: number,
    @Query(
      'month',
      new DefaultValuePipe(new Date().getMonth() + 1),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(1, 12),
    )
    month?: number,
    @Query(
      'limit',
      new DefaultValuePipe(ANALYTICS_DEFAULTS.LIMIT_DEFAULT),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(ANALYTICS_DEFAULTS.LIMIT_MIN, ANALYTICS_DEFAULTS.LIMIT_MAX),
    )
    limit?: number,
  ) {
    return this.analyticsService.getTopMechanicsByMonth(year!, month!, limit);
  }

  // GET /analytics/top-mechanics - 기간별 인기 정비사 TOP N (JWT 필수)
  @Get('top-mechanics')
  @UseGuards(JwtAuthGuard)
  getTopMechanics(
    @Query('period') period: 'realtime' | 'daily' | 'monthly' = 'realtime',
    @Query(
      'limit',
      new DefaultValuePipe(ANALYTICS_DEFAULTS.LIMIT_DEFAULT),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(ANALYTICS_DEFAULTS.LIMIT_MIN, ANALYTICS_DEFAULTS.LIMIT_MAX),
    )
    limit?: number,
    @Query(
      'days',
      new DefaultValuePipe(ANALYTICS_DEFAULTS.DAYS_DEFAULT),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(1, 365),
    )
    days?: number,
    @Query(
      'months',
      new DefaultValuePipe(6),
      new ParseIntPipe({ optional: true }),
      new RangeValidationPipe(1, 60),
    )
    months?: number,
  ) {
    return this.analyticsService.getTopMechanics(period, limit, days, months);
  }
}
