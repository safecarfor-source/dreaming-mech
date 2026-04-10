import { Injectable, Logger } from '@nestjs/common';
import { UploadService } from '../../upload/upload.service';

/**
 * PuLID 얼굴 합성 서비스
 * fal.ai PuLID Flux API를 사용하여 레퍼런스 사진 기반 얼굴 합성 이미지를 생성한다.
 * FAL_AI_API_KEY 없으면 모든 기능을 스킵(null 반환)한다.
 */
@Injectable()
export class FaceCompositeService {
  private readonly logger = new Logger(FaceCompositeService.name);
  private falAvailable = false;
  private falApiKey: string | null = null;

  constructor(private readonly uploadService: UploadService) {
    const apiKey = process.env.FAL_AI_API_KEY;
    if (apiKey) {
      this.falApiKey = apiKey;
      this.falAvailable = true;
      this.logger.log('FaceCompositeService: fal.ai PuLID 활성화');
    } else {
      this.logger.warn('FaceCompositeService: FAL_AI_API_KEY 없음 — 얼굴 합성 비활성화');
    }
  }

  /**
   * PuLID Flux로 얼굴 합성된 이미지 생성
   * @param prompt 이미지 생성 프롬프트
   * @param referenceImageUrl 레퍼런스 사진 URL (S3)
   * @returns S3에 저장된 결과 이미지 URL, FAL_AI_API_KEY 없거나 실패 시 null
   */
  async generateWithFace(
    prompt: string,
    referenceImageUrl: string,
  ): Promise<{ imageUrl: string } | null> {
    if (!this.falAvailable || !this.falApiKey) {
      return null;
    }

    try {
      this.logger.log(`PuLID 얼굴 합성 시작: prompt="${prompt.slice(0, 60)}..."`);

      // fal.ai REST API 직접 호출 (fal-ai/flux-pulid)
      const response = await fetch('https://fal.run/fal-ai/flux-pulid', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.falApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          reference_image_url: referenceImageUrl,
          guidance_scale: 4,
          num_inference_steps: 25,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`fal.ai PuLID API 오류 (${response.status}): ${errText}`);
        return null;
      }

      const result = await response.json() as {
        images?: Array<{ url: string; content_type?: string }>;
        image?: { url: string; content_type?: string };
      };

      // 결과 이미지 URL 추출 (단일 또는 배열 형태 모두 처리)
      const rawImageUrl =
        result.images?.[0]?.url ??
        result.image?.url ??
        null;

      if (!rawImageUrl) {
        this.logger.error('fal.ai PuLID 응답에 이미지 URL 없음');
        return null;
      }

      // 원본 fal.ai URL을 S3에 복사 (영구 보관)
      const s3Url = await this.copyToS3(rawImageUrl);
      this.logger.log(`PuLID 얼굴 합성 완료: ${s3Url.slice(-50)}`);

      return { imageUrl: s3Url };
    } catch (err) {
      this.logger.error('PuLID 얼굴 합성 실패:', err);
      return null;
    }
  }

  /**
   * 외부 URL의 이미지를 S3에 복사
   */
  private async copyToS3(rawUrl: string): Promise<string> {
    try {
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`이미지 다운로드 실패: ${res.status}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') || 'image/png';
      const s3Url = await this.uploadService.uploadBuffer(buffer, contentType, 'thumbnails/face');

      this.logger.log(`S3 복사 완료: ${s3Url.slice(-50)}`);
      return s3Url;
    } catch (err) {
      this.logger.error(`S3 복사 실패, 원본 URL 유지: ${err}`);
      return rawUrl;
    }
  }

  /**
   * FAL_AI_API_KEY 활성화 여부 반환 (외부에서 확인용)
   */
  isAvailable(): boolean {
    return this.falAvailable;
  }
}
