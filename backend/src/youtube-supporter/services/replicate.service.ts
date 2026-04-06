import { Injectable, Logger } from '@nestjs/common';

interface OpenAIImageResponse {
  data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>;
}

interface OpenAIClient {
  images: {
    generate(params: {
      model: string;
      prompt: string;
      n: number;
      size: string;
      quality: string;
      response_format: string;
    }): Promise<OpenAIImageResponse>;
  };
}

/**
 * 이미지 생성 서비스 — OpenAI DALL-E 3
 * (클래스명 ReplicateService 유지 — 기존 import 호환)
 */
@Injectable()
export class ReplicateService {
  private readonly logger = new Logger('ImageGenService');
  private client: OpenAIClient | null = null;

  constructor() {
    this.loadSdk();
  }

  private loadSdk() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const OpenAI = require('openai') as { default?: new (opts: { apiKey: string }) => OpenAIClient };
      const OpenAIClass = OpenAI.default ?? OpenAI;
      if (process.env.OPENAI_API_KEY) {
        this.client = new (OpenAIClass as new (opts: { apiKey: string }) => OpenAIClient)({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.logger.log('OpenAI DALL-E 3 초기화 완료');
      } else {
        this.logger.warn('OPENAI_API_KEY 미설정 — mock 모드로 동작');
      }
    } catch {
      this.logger.warn('openai 패키지를 찾을 수 없습니다. mock 모드로 동작합니다.');
    }
  }

  get isMockMode(): boolean {
    return !this.client;
  }

  /**
   * DALL-E 3로 이미지 생성
   * @returns 생성된 이미지 URL 배열
   */
  async generateImage(prompt: string, options?: {
    width?: number;
    height?: number;
    numOutputs?: number;
  }): Promise<string[]> {
    const width = options?.width ?? 1280;
    const height = options?.height ?? 720;

    if (this.isMockMode) {
      this.logger.warn('OPENAI_API_KEY 미설정 — mock 이미지 반환');
      return [`https://placehold.co/${width}x${height}/1a1a2e/ffffff?text=MOCK+Thumbnail`];
    }

    // DALL-E 3 지원 사이즈: 1024x1024, 1792x1024, 1024x1792
    // 썸네일(1280x720)에 가장 가까운: 1792x1024 (가로형)
    const size = width > height ? '1792x1024' : '1024x1792';

    try {
      this.logger.log(`DALL-E 3 이미지 생성: ${size}, prompt: ${prompt.slice(0, 80)}...`);

      const response = await this.client!.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1, // DALL-E 3는 n=1만 지원
        size,
        quality: 'hd',
        response_format: 'url',
      });

      const urls = response.data
        .map((item) => item.url)
        .filter((url): url is string => !!url);

      if (urls.length === 0) {
        this.logger.error('DALL-E 3 응답에 URL 없음');
        return [];
      }

      this.logger.log(`DALL-E 3 이미지 생성 완료: ${urls.length}장`);
      return urls;
    } catch (error) {
      this.logger.error('DALL-E 3 이미지 생성 실패', error);
      throw error;
    }
  }
}
