import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { MapsModule } from './maps/maps.module';
import { ClickLogModule } from './click-log/click-log.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { CommonModule } from './common/common.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // Rate Limiting: 개발 환경에서는 완화, 프로덕션에서는 엄격
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60초
        limit: process.env.NODE_ENV === 'production' ? 100 : 1000, // 개발: 1000번, 프로덕션: 100번
      },
    ]),
    CommonModule,
    PrismaModule,
    MechanicModule,
    MapsModule,
    ClickLogModule,
    AuthModule,
    UploadModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Disable ThrottlerGuard in test environment
    ...(process.env.NODE_ENV !== 'test'
      ? [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]
      : []),
  ],
})
export class AppModule {}
