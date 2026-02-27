import { Module } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { AdminOwnerController, OwnerMechanicController, OwnerProfileController, AdminCustomerController } from './owner.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminOwnerController, OwnerMechanicController, OwnerProfileController, AdminCustomerController],
  providers: [OwnerService],
  exports: [OwnerService],
})
export class OwnerModule {}
