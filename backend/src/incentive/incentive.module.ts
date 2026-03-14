import { Module } from '@nestjs/common';
import { IncentiveController } from './incentive.controller';
import { IncentiveService } from './incentive.service';

@Module({
  controllers: [IncentiveController],
  providers: [IncentiveService],
})
export class IncentiveModule {}
