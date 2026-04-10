import { Injectable, Logger } from '@nestjs/common';

/**
 * 썸네일 변형 로직 분리 서비스
 * - 변형 타입별 프롬프트 지시 생성
 * - 엔진 교차 로직
 * - 변형 프롬프트 조합
 */
@Injectable()
export class VariationService {
  private readonly logger = new Logger('VariationService');

  /** 변형 타입에 따른 프롬프트 수정 지시 생성 */
  getVariationInstruction(variation: string, customInstruction?: string): string {
    const instructions: Record<string, string> = {
      more_clickbait:
        'Make this more eye-catching and clickbait-style with dramatic lighting and vivid colors',
      more_minimal:
        'Simplify the scene, reduce visual complexity, use cleaner composition',
      face_closer:
        'Make the person larger, more prominent, closer to camera with clear facial expression',
      dark_mode:
        'Change to a very dark, moody atmosphere with deep shadows',
      brighter_bg:
        'Make the background brighter and more vibrant with natural lighting',
      stronger_text:
        'Ensure the background has strong contrast areas for text overlay readability',
      different_engine: '', // 엔진 교차용 — 같은 프롬프트, 다른 엔진
      custom: customInstruction || '',
    };
    return instructions[variation] ?? customInstruction ?? '';
  }

  /** 엔진 교차: 현재 엔진의 반대 엔진 반환 */
  getAlternateEngine(currentEngine?: string): 'gpt-image-1' | 'flux-2-pro' {
    return currentEngine === 'flux-2-pro' ? 'gpt-image-1' : 'flux-2-pro';
  }

  /** 변형 프롬프트 생성 (원본 + 수정 지시 결합) */
  buildVariationPrompt(
    originalPrompt: string,
    variation: string,
    customInstruction?: string,
  ): string {
    const instruction = this.getVariationInstruction(variation, customInstruction);
    if (!instruction) return originalPrompt;
    return `${originalPrompt}\n\nAdditional instruction: ${instruction}`;
  }

  /** 변형이 엔진 교차 타입인지 확인 */
  isDifferentEngineVariation(variation: string): boolean {
    return variation === 'different_engine';
  }
}
