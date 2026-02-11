import { Module } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { AdminOwnerController, OwnerMechanicController } from './owner.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminOwnerController, OwnerMechanicController],
  providers: [OwnerService],
  exports: [OwnerService],
})
export class OwnerModule {}
