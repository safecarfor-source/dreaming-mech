import { Module } from '@nestjs/common';
import { AutoCleanupService } from './auto-cleanup.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TasksController],
  providers: [AutoCleanupService],
  exports: [AutoCleanupService],
})
export class TasksModule {}
