import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UnifiedInquiryController } from './unified-inquiry.controller';
import { UnifiedInquiryService } from './unified-inquiry.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [UnifiedInquiryController],
  providers: [UnifiedInquiryService],
})
export class UnifiedInquiryModule {}
