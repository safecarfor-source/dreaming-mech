import { Injectable, Logger } from '@nestjs/common';

/**
 * Gemini 이미지 생성 서비스 — 한글 텍스트 포함 완성 썸네일 생성
 * Google Gemini 2.0 Flash (Imagen 기반) 사용
 */
@Injectable()
export class GeminiImageService {
  private readonly logger = new Logger('GeminiImageService');
  private readonly apiKey: string | null;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || null;
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY 미설정 — mock 모드로 동작');
    } else {
      this.logger.log('Gemini Image Generation 초기화 완료');
    }
  }

  get isMockMode(): boolean {
    return !this.apiKey;
  }

  /**
   * Gemini로 한글 텍스트 포함 완성 썸네일 생성
   * @param prompt 이미지 생성 프롬프트 (한국어 텍스트 포함)
   * @returns base64 이미지 데이터
   */
  async generateThumbnailImage(prompt: string): Promise<{
    imageBase64: string;
    mimeType: string;
  } | null> {
    if (this.isMockMode) {
      this.logger.warn('GEMINI_API_KEY 미설정 — mock 반환');
      return null;
    }

    try {
      const fullPrompt = this.buildThumbnailPrompt(prompt);
      this.logger.log(`Gemini 썸네일 생성: ${prompt.slice(0, 80)}...`);

      const response = await fetch(
        `${this.baseUrl}/models/gemini-2.5-flash-image:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: fullPrompt }],
              },
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
              responseMimeType: 'text/plain',
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gemini API 에러: ${response.status} ${errorText}`);
        throw new Error(`Gemini API 에러: ${response.status}`);
      }

      const data = await response.json();

      // 응답에서 이미지 파트 추출
      const candidates = data.candidates ?? [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            this.logger.log('Gemini 썸네일 생성 성공');
            return {
              imageBase64: part.inlineData.data,
              mimeType: part.inlineData.mimeType,
            };
          }
        }
      }

      this.logger.warn('Gemini 응답에 이미지 없음');
      return null;
    } catch (error) {
      this.logger.error('Gemini 이미지 생성 실패', error);
      throw error;
    }
  }

  /**
   * 완성 썸네일 3장 동시 생성
   */
  async generateMultipleThumbnails(
    strategies: Array<{
      concept: string;
      textMain: string;
      textSub?: string;
      colorScheme?: { background?: string; textColor?: string; accentColor?: string };
      emotionalTone?: string;
      fluxPrompt?: string;
    }>,
  ): Promise<Array<{ imageBase64: string; mimeType: string; strategyIndex: number } | null>> {
    const results: Array<{ imageBase64: string; mimeType: string; strategyIndex: number } | null> = [];

    // 순차 실행 (Gemini rate limit 고려)
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      try {
        const prompt = this.strategyToPrompt(strategy);
        const result = await this.generateThumbnailImage(prompt);
        results.push(result ? { ...result, strategyIndex: i } : null);
      } catch (err) {
        this.logger.error(`전략 ${i + 1} 이미지 생성 실패:`, err);
        results.push(null);
      }
    }

    return results;
  }

  /**
   * 전략 객체 → Gemini 프롬프트 변환
   */
  private strategyToPrompt(strategy: {
    concept: string;
    textMain: string;
    textSub?: string;
    colorScheme?: { background?: string; textColor?: string; accentColor?: string };
    emotionalTone?: string;
    fluxPrompt?: string;
  }): string {
    const colors = strategy.colorScheme;
    const parts = [
      `유튜브 썸네일 이미지를 만들어줘.`,
      `크기: 1280x720 (16:9 가로형)`,
      `컨셉: ${strategy.concept}`,
      `메인 텍스트: "${strategy.textMain}" (크고 굵은 한글 텍스트, 화면의 30~50% 차지)`,
    ];

    if (strategy.textSub) {
      parts.push(`보조 텍스트: "${strategy.textSub}" (메인보다 작게)`);
    }

    if (colors) {
      parts.push(`색상: 배경 ${colors.background ?? '어두운 톤'}, 텍스트 ${colors.textColor ?? '흰색'}, 강조 ${colors.accentColor ?? '노란색'}`);
    }

    if (strategy.emotionalTone) {
      parts.push(`감정톤: ${strategy.emotionalTone}`);
    }

    if (strategy.fluxPrompt) {
      parts.push(`배경 참고: ${strategy.fluxPrompt}`);
    }

    return parts.join('\n');
  }

  /**
   * 썸네일 최적화 프롬프트 빌드
   */
  private buildThumbnailPrompt(userPrompt: string): string {
    return `당신은 유튜브 썸네일 디자인 전문가입니다.

다음 요청에 맞는 유튜브 썸네일 이미지를 생성해주세요.

## 썸네일 디자인 규칙 (반드시 적용):
- 크기: 1280x720 (16:9 가로형)
- 한국어 텍스트를 이미지 안에 직접 포함 (크고 굵은 고딕체)
- 텍스트에 검은색 테두리(stroke) 또는 그림자 효과 적용
- 고대비 색상 (어두운 배경 + 밝은 텍스트, 또는 빨강/노랑 강조)
- 텍스트는 6글자 이내로 짧고 강렬하게
- 모바일에서도 읽을 수 있을 만큼 큰 글씨
- 전문적이고 클릭하고 싶은 디자인

## 요청:
${userPrompt}`;
  }

  /**
   * 변형 생성 (기존 전략 기반 + 추가 지시)
   */
  async generateVariation(
    originalPrompt: string,
    variation: string,
  ): Promise<{ imageBase64: string; mimeType: string } | null> {
    const variationMap: Record<string, string> = {
      'more-clickbait': '더 자극적이고 클릭을 유도하는 스타일로. 빨간색/노란색 강조, 느낌표, 긴급한 분위기.',
      'more-minimal': '미니멀하고 깔끔한 스타일로. 여백 많이, 텍스트 간결, 모던한 디자인.',
      'bigger-face': '인물 얼굴을 화면의 50% 이상 크게. 놀란 표정이나 강한 감정.',
      'dark-mode': '어두운 배경 + 네온 느낌의 밝은 텍스트. 신비롭고 프리미엄한 느낌.',
    };

    const variationInstruction = variationMap[variation] || variation;
    const prompt = `${originalPrompt}\n\n추가 지시: ${variationInstruction}`;
    return this.generateThumbnailImage(prompt);
  }
}
