import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MapsService } from './maps.service';
import { MapsController } from './maps.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
