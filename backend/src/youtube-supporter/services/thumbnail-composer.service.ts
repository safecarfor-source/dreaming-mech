import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp') as typeof import('sharp');

/**
 * 썸네일 완성 합성 서비스
 * DALL-E 없이 코드로 배경 생성 + 인물 합성 + 한글 텍스트
 * 커리어해커 스타일: 심플 배경 + 실사 인물 + 굵은 텍스트
 */
@Injectable()
export class ThumbnailComposerService {
  private readonly logger = new Logger('ThumbnailComposer');

  // 프리셋 배경 색상 팔레트
  private readonly PALETTES = [
    // 다크 그라데이션 (긴급/경고)
    { bg1: '#1a1a2e', bg2: '#16213e', accent: '#e94560' },
    // 블루 그라데이션 (신뢰/정보)
    { bg1: '#0f0c29', bg2: '#302b63', accent: '#24243e' },
    // 다크 그린 (안전/실용)
    { bg1: '#0d1117', bg2: '#161b22', accent: '#238636' },
    // 웜 다크 (친근/브이로그)
    { bg1: '#1a1a1a', bg2: '#2d2d2d', accent: '#f5a623' },
    // 레드 다크 (긴급/위험)
    { bg1: '#1a0000', bg2: '#2d0a0a', accent: '#ff4444' },
    // 클린 화이트 (교육/깔끔)
    { bg1: '#f0f0f0', bg2: '#e0e0e0', accent: '#333333' },
  ];

  /**
   * 코드로 배경 생성 + 텍스트 합성 (인물 없이)
   */
  async composeThumbnail(
    _backgroundBuffer: Buffer | null,
    options: {
      textMain: string;
      textSub?: string;
      textColor?: string;
      accentColor?: string;
      strokeColor?: string;
      fontSize?: number;
      subFontSize?: number;
      paletteIndex?: number;
      bgColor1?: string;
      bgColor2?: string;
    },
  ): Promise<Buffer> {
    const {
      textMain,
      textSub,
      textColor = '#FFFFFF',
      accentColor = '#FFD700',
      strokeColor = '#000000',
      fontSize = 95,
      subFontSize = 55,
      paletteIndex,
      bgColor1,
      bgColor2,
    } = options;

    const W = 1280;
    const H = 720;

    // 배경 색상 결정
    const palette = this.PALETTES[paletteIndex ?? Math.floor(Math.random() * this.PALETTES.length)];
    const color1 = bgColor1 || palette.bg1;
    const color2 = bgColor2 || palette.bg2;

    try {
      // 1. 그라데이션 배경 SVG 생성
      const bgSvg = this.createBackgroundSvg(W, H, color1, color2);
      const background = await sharp(Buffer.from(bgSvg))
        .png()
        .toBuffer();

      // 2. 텍스트 오버레이
      const textSvg = this.createTextSvg({
        width: W,
        height: H,
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
          { input: Buffer.from(textSvg), top: 0, left: 0 },
        ])
        .png()
        .toBuffer();

      this.logger.log(`썸네일 합성 완료: ${result.length} bytes`);
      return result;
    } catch (error) {
      this.logger.error('썸네일 합성 실패:', error);
      throw error;
    }
  }

  /**
   * 코드 배경 + 인물사진 합성 + 텍스트 = 완성 썸네일
   */
  async composeWithPerson(
    personBuffer: Buffer,
    options: {
      textMain: string;
      textSub?: string;
      textColor?: string;
      accentColor?: string;
      strokeColor?: string;
      fontSize?: number;
      subFontSize?: number;
      paletteIndex?: number;
      personPosition?: 'left' | 'right' | 'center';
    },
  ): Promise<Buffer> {
    const {
      textMain,
      textSub,
      textColor = '#FFFFFF',
      accentColor = '#FFD700',
      strokeColor = '#000000',
      fontSize = 95,
      subFontSize = 55,
      paletteIndex,
      personPosition = 'right',
    } = options;

    const W = 1280;
    const H = 720;

    const palette = this.PALETTES[paletteIndex ?? Math.floor(Math.random() * this.PALETTES.length)];

    try {
      // 1. 그라데이션 배경
      const bgSvg = this.createBackgroundSvg(W, H, palette.bg1, palette.bg2);
      const background = await sharp(Buffer.from(bgSvg)).png().toBuffer();

      // 2. 인물 리사이즈 (높이의 85%)
      const personHeight = Math.round(H * 0.85);
      const personImg = await sharp(personBuffer)
        .resize({ height: personHeight, withoutEnlargement: false })
        .png()
        .toBuffer();
      const personMeta = await sharp(personImg).metadata();
      const personWidth = personMeta.width || 400;

      // 3. 인물 위치 계산
      let personX: number;
      let textX: number;
      if (personPosition === 'right') {
        personX = W - personWidth - 20;
        textX = 50;
      } else if (personPosition === 'left') {
        personX = 20;
        textX = personWidth + 60;
      } else {
        personX = Math.round((W - personWidth) / 2);
        textX = 50;
      }
      const personY = H - personHeight;

      // 4. 텍스트
      const textSvg = this.createTextSvg({
        width: W,
        height: H,
        textMain,
        textSub,
        textColor,
        accentColor,
        strokeColor,
        fontSize,
        subFontSize,
        textX,
      });

      // 5. 전체 합성
      const result = await sharp(background)
        .composite([
          { input: personImg, top: personY, left: personX },
          { input: Buffer.from(textSvg), top: 0, left: 0 },
        ])
        .png()
        .toBuffer();

      this.logger.log(`인물 합성 썸네일 완료: ${result.length} bytes`);
      return result;
    } catch (error) {
      this.logger.error('인물 합성 실패:', error);
      throw error;
    }
  }

  /**
   * 그라데이션 배경 SVG
   */
  private createBackgroundSvg(w: number, h: number, color1: string, color2: string): string {
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
</svg>`;
  }

  /**
   * 텍스트 오버레이 SVG
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
    textX?: number;
  }): string {
    const { width, height, textMain, textSub, textColor, accentColor, strokeColor, fontSize, subFontSize } = opts;
    const textX = opts.textX ?? 50;
    const mainY = height * 0.45;
    const subY = mainY + fontSize + 15;
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ts" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.7"/>
    </filter>
  </defs>
  <text x="${textX}" y="${mainY}"
    font-family="'Noto Sans CJK KR','Noto Sans KR','Apple SD Gothic Neo',sans-serif"
    font-size="${fontSize}" font-weight="900" letter-spacing="-3" filter="url(#ts)"
    paint-order="stroke" stroke="${strokeColor}" stroke-width="8" stroke-linejoin="round"
    fill="${textColor}">
    ${escape(textMain)}
  </text>`;

    if (textSub) {
      svg += `
  <text x="${textX}" y="${subY}"
    font-family="'Noto Sans CJK KR','Noto Sans KR','Apple SD Gothic Neo',sans-serif"
    font-size="${subFontSize}" font-weight="700" letter-spacing="-1" filter="url(#ts)"
    paint-order="stroke" stroke="${strokeColor}" stroke-width="5" stroke-linejoin="round"
    fill="${accentColor}">
    ${escape(textSub)}
  </text>`;
    }

    svg += '\n</svg>';
    return svg;
  }
}
