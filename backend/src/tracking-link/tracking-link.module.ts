import { Module } from '@nestjs/common';
import { TrackingLinkController } from './tracking-link.controller';
import { TrackingLinkService } from './tracking-link.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrackingLinkController],
  providers: [TrackingLinkService],
  exports: [TrackingLinkService],
})
export class TrackingLinkModule {}
