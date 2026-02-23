import { Module } from '@nestjs/common';
import { TireInquiryController } from './tire-inquiry.controller';
import { TireInquiryService } from './tire-inquiry.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TireInquiryController],
  providers: [TireInquiryService],
})
export class TireInquiryModule {}
