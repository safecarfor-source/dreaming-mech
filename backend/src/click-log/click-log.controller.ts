import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ClickLogService } from './click-log.service';

@Controller('click-logs')
export class ClickLogController {
  constructor(private readonly clickLogService: ClickLogService) {}

  // GET /click-logs/stats/:mechanicId
  @Get('stats/:mechanicId')
  getStats(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.clickLogService.getStats(mechanicId);
  }
}
