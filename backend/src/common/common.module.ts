import { Module, Global } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { BotDetectionGuard } from './guards/bot-detection.guard';

@Global()
@Module({
  providers: [CacheService, BotDetectionGuard],
  exports: [CacheService, BotDetectionGuard],
})
export class CommonModule {}
