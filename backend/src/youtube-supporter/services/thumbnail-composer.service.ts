import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp') as typeof import('sharp');

/**
 * 썸네일 합성 서비스 — DALL-E 배경 위에 한글 텍스트 자동 합성
 * sharp + SVG 오버레이 방식
 */
@Injectable()
export class ThumbnailComposerService {
  private readonly logger = new Logger('ThumbnailComposer');

  /**
   * 배경 이미지 위에 한글 텍스트를 합성하여 완성 썸네일 생성
   */
  async composeThumbnail(
    backgroundBuffer: Buffer,
    options: {
      textMain: string;
      textSub?: string;
      textColor?: string;      // HEX (default: #FFFFFF)
      accentColor?: string;    // HEX (default: #FFD700)
      strokeColor?: string;    // HEX (default: #000000)
      fontSize?: number;       // px (default: 80)
      subFontSize?: number;    // px (default: 50)
    },
  ): Promise<Buffer> {
    const {
      textMain,
      textSub,
      textColor = '#FFFFFF',
      accentColor = '#FFD700',
      strokeColor = '#000000',
      fontSize = 90,
      subFontSize = 55,
    } = options;

    const WIDTH = 1280;
    const HEIGHT = 720;

    try {
      // 1. 배경 리사이즈 (1280x720)
      const background = await sharp(backgroundBuffer)
        .resize(WIDTH, HEIGHT, { fit: 'cover' })
        .toBuffer();

      // 2. SVG 텍스트 오버레이 생성
      const svgText = this.createTextSvg({
        width: WIDTH,
        height: HEIGHT,
        textMain,
        textSub,
        textColor,
        accentColor,
        strokeColor,
        fontSize,
        subFontSize,
      });

      // 3. 합성
      const result = await sharp(background)
        .composite([
          {
            input: Buffer.from(svgText),
            top: 0,
            left: 0,
          },
        ])
        .png({ quality: 90 })
        .toBuffer();

      this.logger.log(`썸네일 합성 완료: ${result.length} bytes`);
      return result;
    } catch (error) {
      this.logger.error('썸네일 합성 실패:', error);
      throw error;
    }
  }

  /**
   * SVG 텍스트 오버레이 생성
   * 한글 폰트: 시스템 고딕 (Docker에서는 NanumGothic)
   */
  private createTextSvg(opts: {
    width: number;
    height: number;
    textMain: string;
    textSub?: string;
    textColor: string;
    accentColor: string;
    strokeColor: string;
    fontSize: number;
    subFontSize: number;
  }): string {
    const { width, height, textMain, textSub, textColor, accentColor, strokeColor, fontSize, subFontSize } = opts;

    // 메인 텍스트 위치 (좌측 중앙)
    const mainY = height * 0.45;
    const subY = mainY + fontSize + 15;
    const textX = 50;

    // XML 이스케이프
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="3" dy="3" stdDeviation="4" flood-color="${strokeColor}" flood-opacity="0.8"/>
    </filter>
  </defs>

  <!-- 하단 그라데이션 오버레이 (텍스트 가독성) -->
  <rect x="0" y="${height * 0.35}" width="${width}" height="${height * 0.65}" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0"/>
      <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.75"/>
    </linearGradient>
  </defs>

  <!-- 메인 텍스트 (stroke + fill) -->
  <text x="${textX}" y="${mainY}"
    font-family="'Noto Sans CJK KR','Noto Sans KR','NanumGothic','Apple SD Gothic Neo',sans-serif"
    font-size="${fontSize}" font-weight="900" letter-spacing="-2" filter="url(#shadow)"
    paint-order="stroke" stroke="${strokeColor}" stroke-width="8" stroke-linejoin="round"
    fill="${textColor}">
    ${escape(textMain)}
  </text>`;

    if (textSub) {
      svg += `
  <!-- 보조 텍스트 -->
  <text x="${textX}" y="${subY}"
    font-family="'Noto Sans CJK KR','Noto Sans KR','NanumGothic','Apple SD Gothic Neo',sans-serif"
    font-size="${subFontSize}" font-weight="700" letter-spacing="-1" filter="url(#shadow)"
    paint-order="stroke" stroke="${strokeColor}" stroke-width="5" stroke-linejoin="round"
    fill="${accentColor}">
    ${escape(textSub)}
  </text>`;
    }

    svg += '\n</svg>';
    return svg;
  }
}
