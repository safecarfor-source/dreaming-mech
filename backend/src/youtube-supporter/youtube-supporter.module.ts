import { Module } from '@nestjs/common';
import { YouTubeSupporterController } from './youtube-supporter.controller';
import { YouTubeSupporterService } from './youtube-supporter.service';
import { YoutubeApiService } from './services/youtube-api.service';
import { TranscriptService } from './services/transcript.service';
import { AiOrchestrationService } from './services/ai-orchestration.service';
import { ReplicateService } from './services/replicate.service';

/**
 * YouTube Supporter 모듈
 * PrismaModule은 @Global() 이므로 imports 불필요
 */
@Module({
  controllers: [YouTubeSupporterController],
  providers: [
    YouTubeSupporterService,
    YoutubeApiService,
    TranscriptService,
    AiOrchestrationService,
    ReplicateService,
  ],
})
export class YouTubeSupporterModule {}
