import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ServiceInquiryController } from './service-inquiry.controller';
import { ServiceInquiryService } from './service-inquiry.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule, JwtModule.register({})],
  controllers: [ServiceInquiryController],
  providers: [ServiceInquiryService],
})
export class ServiceInquiryModule {}
