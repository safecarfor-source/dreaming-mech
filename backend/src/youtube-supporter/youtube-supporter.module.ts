import { Module } from '@nestjs/common';
import { YouTubeSupporterController } from './youtube-supporter.controller';
import { YouTubeSupporterService } from './youtube-supporter.service';
import { YoutubeApiService } from './services/youtube-api.service';
import { TranscriptService } from './services/transcript.service';
import { AiOrchestrationService } from './services/ai-orchestration.service';
import { ReplicateService } from './services/replicate.service';
import { BackgroundRemovalService } from './services/background-removal.service';
import { GeminiImageService } from './services/gemini-image.service';
import { ThumbnailComposerService } from './services/thumbnail-composer.service';
import { UploadModule } from '../upload/upload.module';

/**
 * YouTube Supporter 모듈
 * PrismaModule은 @Global() 이므로 imports 불필요
 */
@Module({
  imports: [UploadModule],
  controllers: [YouTubeSupporterController],
  providers: [
    YouTubeSupporterService,
    YoutubeApiService,
    TranscriptService,
    AiOrchestrationService,
    ReplicateService,
    BackgroundRemovalService,
    GeminiImageService,
    ThumbnailComposerService,
  ],
})
export class YouTubeSupporterModule {}
