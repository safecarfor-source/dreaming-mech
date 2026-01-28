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
    // Rate Limiting: 60초에 최대 100번 요청
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60초
        limit: 100, // 최대 100번
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
