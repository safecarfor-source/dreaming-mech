import { Module } from '@nestjs/common';
import { ClickLogService } from './click-log.service';
import { ClickLogController } from './click-log.controller';

@Module({
  controllers: [ClickLogController],
  providers: [ClickLogService],
})
export class ClickLogModule {}
