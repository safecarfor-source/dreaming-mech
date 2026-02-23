import { Module } from '@nestjs/common';
import { ServiceInquiryController } from './service-inquiry.controller';
import { ServiceInquiryService } from './service-inquiry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [ServiceInquiryController],
  providers: [ServiceInquiryService],
})
export class ServiceInquiryModule {}
