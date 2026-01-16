import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MechanicModule } from './mechanic/mechanic.module';
import { MapsModule } from './maps/maps.module';
import { ClickLogModule } from './click-log/click-log.module';

@Module({
  imports: [
    PrismaModule,
    MechanicModule,
    MapsModule,
    ClickLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
