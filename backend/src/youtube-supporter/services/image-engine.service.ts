import { Injectable, Logger } from '@nestjs/common';
import { UploadService } from '../../upload/upload.service';

// ── 인터페이스 ────────────────────────────────────────────────

export interface ImageGenerationRequest {
  prompt: string;
  engine: 'gpt-image-1' | 'flux-2-pro' | 'auto';
  width?: number;   // default 1792
  height?: number;  // default 1024
  quality?: 'low' | 'medium' | 'high';
}

export interface ImageGenerationResult {
  imageUrl: string;  // S3 URL (즉시 복사 후)
  engine: string;
  cost: number;
  metadata: Record<string, unknown>;
}

// ── OpenAI 타입 ───────────────────────────────────────────────

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
    }): Promise<OpenAIImageResponse>;
  };
}

// ── fal.ai 타입 ───────────────────────────────────────────────

interface FalImageOutput {
  url: string;
  width?: number;
  height?: number;
}

interface FalResult {
  images?: FalImageOutput[];
}

interface FalClient {
  config(opts: { credentials: string }): void;
  subscribe(
    model: string,
    opts: { input: Record<string, unknown> },
  ): Promise<{ data: FalResult; requestId: string }>;
}

// ── 엔진 자동 선택 ────────────────────────────────────────────

const PERSON_KEYWORDS = ['person', 'mechanic', 'man', 'woman', 'face', 'people', 'portrait', 'human'];
const CAR_KEYWORDS    = ['car', 'engine', 'brake', 'tool', 'part', 'vehicle', 'tire', 'wheel', 'auto'];

function selectEngine(prompt: string, recommendedEngine?: string): 'gpt-image-1' | 'flux-2-pro' {
  if (recommendedEngine === 'gpt-image-1' || recommendedEngine === 'flux-2-pro') {
    return recommendedEngine;
  }
  const lower = prompt.toLowerCase();
  if (PERSON_KEYWORDS.some((kw) => lower.includes(kw))) return 'gpt-image-1';
  if (CAR_KEYWORDS.some((kw) => lower.includes(kw))) return 'flux-2-pro';
  return 'gpt-image-1'; // 기본값
}

// ── 서비스 ────────────────────────────────────────────────────

@Injectable()
export class ImageEngineService {
  private readonly logger = new Logger(ImageEngineService.name);

  private openaiClient: OpenAIClient | null = null;
  private falClient: FalClient | null = null;

  constructor(private readonly uploadService: UploadService) {
    this.loadOpenAI();
    this.loadFal();
  }

  // ── SDK 초기화 ────────────────────────────────────────────

  private loadOpenAI(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const OpenAI = require('openai') as { default?: new (opts: { apiKey: string }) => OpenAIClient };
      const OpenAIClass = OpenAI.default ?? OpenAI;
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new (OpenAIClass as new (opts: { apiKey: string }) => OpenAIClient)({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.logger.log('GPT Image (OpenAI) 초기화 완료');
      } else {
        this.logger.warn('OPENAI_API_KEY 미설정 — GPT Image mock 모드');
      }
    } catch {
      this.logger.warn('openai 패키지를 찾을 수 없습니다. mock 모드로 동작합니다.');
    }
  }

  private loadFal(): void {
    if (!process.env.FAL_AI_API_KEY) {
      this.logger.warn('FAL_AI_API_KEY 미설정 — FLUX 비활성화, GPT Image 단일 엔진으로 동작');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const falModule = require('@fal-ai/client') as { fal?: FalClient } | FalClient;
      const fal = (falModule as { fal?: FalClient }).fal ?? (falModule as FalClient);
      fal.config({ credentials: process.env.FAL_AI_API_KEY });
      this.falClient = fal;
      this.logger.log('FLUX 2 Pro (fal.ai) 초기화 완료');
    } catch {
      this.logger.warn('@fal-ai/client 패키지를 찾을 수 없습니다. FLUX 비활성화.');
    }
  }

  // ── 상태 확인 ─────────────────────────────────────────────

  get isGptImageAvailable(): boolean {
    return !!this.openaiClient;
  }

  get isFluxAvailable(): boolean {
    return !!this.falClient;
  }

  // ── 단일 진입점 ───────────────────────────────────────────

  /**
   * 이미지 생성 — S3 URL 반환
   * @param request 요청 파라미터
   * @param recommendedEngine 전략 JSON의 recommendedEngine (optional)
   */
  async generateImage(
    request: ImageGenerationRequest,
    recommendedEngine?: string,
  ): Promise<ImageGenerationResult> {
    const width  = request.width  ?? 1792;
    const height = request.height ?? 1024;

    // 실제 사용 엔진 결정
    let targetEngine: 'gpt-image-1' | 'flux-2-pro';
    if (request.engine === 'auto') {
      targetEngine = selectEngine(request.prompt, recommendedEngine);
    } else {
      targetEngine = request.engine;
    }

    // FLUX가 비활성화 상태이면 GPT Image로 폴백
    if (targetEngine === 'flux-2-pro' && !this.isFluxAvailable) {
      this.logger.warn('FLUX 비활성화 — GPT Image로 폴백');
      targetEngine = 'gpt-image-1';
    }

    this.logger.log(`이미지 생성 시작: engine=${targetEngine}, ${width}x${height}`);

    let rawUrl: string;
    let cost = 0;
    const metadata: Record<string, unknown> = {};

    let engineResult: { rawUrl: string; cost: number; metadata: Record<string, unknown> };

    if (targetEngine === 'flux-2-pro' && this.isFluxAvailable) {
      engineResult = await this.generateWithFlux(request.prompt, width, height);
    } else {
      engineResult = await this.generateWithGptImage(
        request.prompt, width, height, request.quality ?? 'high',
      );
    }

    rawUrl = engineResult.rawUrl;
    cost   = engineResult.cost;
    Object.assign(metadata, engineResult.metadata);

    // S3 즉시 복사
    const imageUrl = await this.copyToS3(rawUrl);

    this.logger.log(`이미지 생성 완료: engine=${targetEngine}, s3=${imageUrl}`);

    return { imageUrl, engine: targetEngine, cost, metadata };
  }

  /**
   * 기존 ReplicateService.generateImage 호환 래퍼
   * youtube-supporter.service.ts에서 직접 URL 배열이 필요한 곳에 사용
   */
  async generateImageUrls(
    prompt: string,
    options?: { width?: number; height?: number },
  ): Promise<string[]> {
    const width  = options?.width  ?? 1280;
    const height = options?.height ?? 720;

    // mock 모드: 두 엔진 모두 없는 경우
    if (!this.isGptImageAvailable && !this.isFluxAvailable) {
      this.logger.warn('모든 엔진 미설정 — mock 이미지 반환');
      return [`https://placehold.co/${width}x${height}/1a1a2e/ffffff?text=MOCK+Thumbnail`];
    }

    try {
      const result = await this.generateImage(
        { prompt, engine: 'auto', width, height },
      );
      return [result.imageUrl];
    } catch (error) {
      this.logger.error('이미지 생성 실패', error);
      throw error;
    }
  }

  // ── GPT Image 생성 ────────────────────────────────────────

  private async generateWithGptImage(
    prompt: string,
    width: number,
    height: number,
    quality: 'low' | 'medium' | 'high',
  ): Promise<{ rawUrl: string; cost: number; metadata: Record<string, unknown> }> {
    // mock 모드
    if (!this.openaiClient) {
      this.logger.warn('OPENAI_API_KEY 미설정 — mock 이미지 반환');
      return {
        rawUrl: `https://placehold.co/${width}x${height}/1a1a2e/ffffff?text=MOCK+Thumbnail`,
        cost: 0,
        metadata: { mock: true },
      };
    }

    // GPT Image 지원 사이즈: 1024x1024, 1536x1024, 1024x1536, auto
    const size = width > height ? '1536x1024' : '1024x1536';

    this.logger.log(`GPT Image 생성: size=${size}, quality=${quality}, prompt=${prompt.slice(0, 80)}...`);

    // gpt-image-1은 response_format을 지원하지 않음 (항상 b64_json 반환)
    const response = await this.openaiClient.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size,
      quality,
    });

    const b64 = response.data[0]?.b64_json;
    if (!b64) {
      throw new Error('GPT Image 응답에 b64_json 없음');
    }

    // base64 → Buffer → S3 업로드하여 URL 획득
    const buffer = Buffer.from(b64, 'base64');
    const url = await this.uploadService.uploadBuffer(buffer, 'image/png', 'thumbnails/bg');

    // 비용 추산: high=$0.19, medium=$0.07, low=$0.04 (1024x1024 기준)
    const costMap: Record<string, number> = { high: 0.19, medium: 0.07, low: 0.04 };

    return {
      rawUrl: url,
      cost: costMap[quality] ?? 0.19,
      metadata: {
        model: 'gpt-image-1',
        size,
        quality,
        revisedPrompt: response.data[0]?.revised_prompt,
      },
    };
  }

  // ── FLUX 2 Pro 생성 ───────────────────────────────────────

  private async generateWithFlux(
    prompt: string,
    width: number,
    height: number,
  ): Promise<{ rawUrl: string; cost: number; metadata: Record<string, unknown> }> {
    if (!this.falClient) {
      throw new Error('FLUX 클라이언트 미초기화');
    }

    this.logger.log(`FLUX 2 Pro 생성: ${width}x${height}, prompt=${prompt.slice(0, 80)}...`);

    const result = await this.falClient.subscribe('fal-ai/flux-2-pro', {
      input: {
        prompt,
        image_size: { width, height },
      },
    });

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error('FLUX 응답에 이미지 URL 없음');
    }

    return {
      rawUrl: imageUrl,
      cost: 0.05, // FLUX 2 Pro 추산
      metadata: {
        model: 'fal-ai/flux-2-pro',
        requestId: result.requestId,
        width,
        height,
      },
    };
  }

  // ── S3 복사 ───────────────────────────────────────────────

  /**
   * 외부 이미지 URL → Buffer 다운로드 → S3 업로드 → S3 URL 반환
   * mock URL(placehold.co)은 그대로 반환
   */
  private async copyToS3(rawUrl: string): Promise<string> {
    // mock 이미지는 S3 복사 불필요
    if (rawUrl.includes('placehold.co')) {
      return rawUrl;
    }

    try {
      const res = await fetch(rawUrl);
      if (!res.ok) {
        throw new Error(`이미지 다운로드 실패: HTTP ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Content-Type 추론 (기본 png)
      const contentType = res.headers.get('content-type') || 'image/png';
      const s3Url = await this.uploadService.uploadBuffer(buffer, contentType, 'thumbnails');
      this.logger.log(`S3 복사 완료: ${s3Url}`);
      return s3Url;
    } catch (err) {
      this.logger.error(`S3 복사 실패, 원본 URL 유지: ${err}`);
      return rawUrl; // S3 실패 시 원본 URL 폴백
    }
  }
}
