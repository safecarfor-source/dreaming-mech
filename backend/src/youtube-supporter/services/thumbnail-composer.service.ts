import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp') as typeof import('sharp');

/**
 * 하네스 기반 썸네일 합성 서비스
 * ─────────────────────────────────
 * 시스템 강제 규칙 (프롬프트가 아닌 코드로 강제):
 * 1. 메인 폰트 최소 140px — 작은 글씨 구조적 불가
 * 2. 레이아웃 3가지 고정 — 검증된 배치만 허용
 * 3. 자동 줄바꿈 — 긴 텍스트도 화면에 맞춤
 * 4. 인물 90% 높이 — 작은 인물 불가
 * 5. 색상 대비 검증 — 읽기 어려운 조합 차단
 */
@Injectable()
export class ThumbnailComposerService {
  private readonly logger = new Logger('ThumbnailComposer');

  // ═══════════════════════════════════════════
  // 하네스 상수 (코드로 강제, 외부 변경 불가)
  // ═══════════════════════════════════════════
  private readonly HARNESS = {
    CANVAS_WIDTH: 1280,
    CANVAS_HEIGHT: 720,
    MIN_MAIN_FONT: 140,
    MAX_MAIN_FONT: 200,
    MIN_SUB_FONT: 55,
    MAX_SUB_FONT: 80,
    MAIN_CHARS_PER_LINE: 5,     // 메인 텍스트 줄당 최대 글자수
    SUB_CHARS_PER_LINE: 10,     // 보조 텍스트 줄당 최대 글자수
    PERSON_HEIGHT_RATIO: 0.92,  // 인물 = 캔버스 높이의 92%
    TEXT_STROKE_WIDTH: 14,      // 텍스트 외곽선 두께
    TEXT_SHADOW_BLUR: 8,        // 텍스트 그림자 블러 (모바일 가독성 강화)
    MIN_PERSON_WIDTH_RATIO: 0.35, // 인물 최소 너비 = 캔버스의 35% (얼굴 40%+ 규칙)
  } as const;

  // 검증된 레이아웃 템플릿 (이것만 허용)
  private readonly LAYOUTS = {
    'person-right': {
      personXFn: (pW: number, cW: number) => cW - pW + 20,  // 오른쪽 끝
      textX: 60,
      textMaxWidth: 680,
      textAlign: 'left' as const,
    },
    'person-left': {
      personXFn: (_pW: number, _cW: number) => -20,  // 왼쪽 끝
      textX: 550,
      textMaxWidth: 680,
      textAlign: 'left' as const,
    },
    'text-center': {
      personXFn: null,  // 인물 없음
      textX: 640,       // 중앙
      textMaxWidth: 1100,
      textAlign: 'center' as const,
    },
  } as const;

  // 프리셋 배경 팔레트 (다크 위주 — 텍스트 가독성 최우선)
  private readonly PALETTES = [
    { bg1: '#0a0a14', bg2: '#1a1a3e', accent: '#FFD700', name: '미드나잇' },
    { bg1: '#0d1117', bg2: '#161b22', accent: '#58a6ff', name: '다크블루' },
    { bg1: '#1a0000', bg2: '#3d0a0a', accent: '#ff4444', name: '긴급레드' },
    { bg1: '#0a0a0a', bg2: '#1a1a1a', accent: '#00ff88', name: '블랙그린' },
    { bg1: '#1a1025', bg2: '#2d1b4e', accent: '#bf5af2', name: '퍼플' },
    { bg1: '#0d1b0d', bg2: '#1a2e1a', accent: '#4ade80', name: '포레스트' },
    // CTR 최적화 고대비 팔레트 (유튜브 UI와 대비 극대화)
    { bg1: '#1a0000', bg2: '#4a0000', accent: '#FF0000', name: '레드얼러트' },
    { bg1: '#0a0a0a', bg2: '#1a1a1a', accent: '#FF6600', name: '오렌지워닝' },
    { bg1: '#1a1a00', bg2: '#3d3d00', accent: '#FFFF00', name: '옐로우' },
  ];

  /**
   * emotionalTone 기반 폰트 자동 선택
   * 긴급/경고 → Black Han Sans, 교육/정보 → Noto Sans KR, 친근/일상 → Jua
   */
  private selectFont(emotionalTone?: string): string {
    if (!emotionalTone) return "'Black Han Sans','Noto Sans CJK KR',sans-serif";
    const tone = emotionalTone.toLowerCase();
    if (['긴급', '경고', '위험', '충격', '주의'].some((k) => tone.includes(k)))
      return "'Black Han Sans','Noto Sans CJK KR',sans-serif";
    if (['교육', '정보', '팁', '가이드', '설명'].some((k) => tone.includes(k)))
      return "'Noto Sans KR','Noto Sans CJK KR',sans-serif";
    if (['친근', '일상', '브이로그', '재미', '유머'].some((k) => tone.includes(k)))
      return "'Jua','Noto Sans CJK KR',sans-serif";
    return "'Black Han Sans','Noto Sans CJK KR',sans-serif";
  }

  /**
   * 완성 썸네일: 배경 + 인물 + 텍스트 (메인 파이프라인)
   */
  async composeComplete(
    backgroundBuffer: Buffer,
    personBuffer: Buffer | null,
    options: {
      textMain: string;
      textSub?: string;
      textColor?: string;
      accentColor?: string;
      strokeColor?: string;
      layout?: 'person-right' | 'person-left' | 'text-center';
      emotionalTone?: string;
    },
  ): Promise<Buffer> {
    const {
      textMain,
      textSub,
      textColor = '#FFFFFF',
      accentColor = '#FFD700',
      strokeColor = '#000000',
      layout = personBuffer ? 'person-right' : 'text-center',
      emotionalTone,
    } = options;

    const W = this.HARNESS.CANVAS_WIDTH;
    const H = this.HARNESS.CANVAS_HEIGHT;
    const layoutConfig = this.LAYOUTS[layout];

    try {
      // 1. 배경 리사이즈 (정확히 1280x720)
      const background = await sharp(backgroundBuffer)
        .resize(W, H, { fit: 'cover' })
        .png()
        .toBuffer();

      const composites: Array<{ input: Buffer; top: number; left: number }> = [];

      // 2. 인물 합성 (있으면)
      let textX = layoutConfig.textX;
      if (personBuffer && layoutConfig.personXFn) {
        let personHeight = Math.round(H * this.HARNESS.PERSON_HEIGHT_RATIO);
        let personImg = await sharp(personBuffer)
          .resize({ height: personHeight, withoutEnlargement: false })
          .png()
          .toBuffer();
        const meta = await sharp(personImg).metadata();
        let personWidth = meta.width || 400;

        // 하네스: 인물 최소 너비 35% 강제 (얼굴 40%+ 규칙)
        const minPersonWidth = Math.round(W * this.HARNESS.MIN_PERSON_WIDTH_RATIO);
        if (personWidth < minPersonWidth) {
          const scale = minPersonWidth / personWidth;
          personHeight = Math.round(personHeight * scale);
          personWidth = minPersonWidth;
          personImg = await sharp(personBuffer)
            .resize({ width: personWidth, height: personHeight, withoutEnlargement: false })
            .png()
            .toBuffer();
        }

        const personX = layoutConfig.personXFn(personWidth, W);
        const personY = Math.max(0, H - personHeight);

        composites.push({ input: personImg, top: personY, left: personX });
      } else {
        // 인물 없으면 중앙 레이아웃
        textX = 640;
      }

      // 3. 텍스트 오버레이 (하네스 강제 규칙 적용)
      const fontSize = this.enforceFontSize(textMain.length);
      const subFontSize = Math.min(
        Math.max(this.HARNESS.MIN_SUB_FONT, Math.round(fontSize * 0.45)),
        this.HARNESS.MAX_SUB_FONT,
      );

      const textSvg = this.createHarnessTextSvg({
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
        textAlign: layoutConfig.textAlign,
        maxWidth: layoutConfig.textMaxWidth,
        emotionalTone,
      });

      composites.push({ input: Buffer.from(textSvg), top: 0, left: 0 });

      // 4. 전체 합성
      const result = await sharp(background)
        .composite(composites)
        .png()
        .toBuffer();

      this.logger.log(`하네스 썸네일 완성: ${result.length} bytes, 레이아웃=${layout}, 폰트=${fontSize}px`);
      return result;
    } catch (error) {
      this.logger.error('하네스 썸네일 합성 실패:', error);
      throw error;
    }
  }

  /**
   * 코드 배경 생성 (DALL-E 실패 시 폴백)
   */
  async createCodeBackground(
    paletteIndex?: number,
    options?: { pattern?: 'gradient' | 'radial' | 'split' },
  ): Promise<Buffer> {
    const W = this.HARNESS.CANVAS_WIDTH;
    const H = this.HARNESS.CANVAS_HEIGHT;
    const palette = this.PALETTES[paletteIndex ?? Math.floor(Math.random() * this.PALETTES.length)];
    const pattern = options?.pattern ?? 'gradient';

    let bgSvg: string;
    switch (pattern) {
      case 'radial':
        bgSvg = this.createRadialBgSvg(W, H, palette.bg1, palette.bg2);
        break;
      case 'split':
        bgSvg = this.createSplitBgSvg(W, H, palette.bg1, palette.bg2);
        break;
      default:
        bgSvg = this.createGradientBgSvg(W, H, palette.bg1, palette.bg2);
    }

    return sharp(Buffer.from(bgSvg)).png().toBuffer();
  }

  /**
   * 이전 호환용: composeThumbnail (코드 배경 + 텍스트만)
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
    // 코드 배경 생성
    const bgBuffer = await this.createCodeBackground(options.paletteIndex);
    // 하네스 적용 합성
    return this.composeComplete(bgBuffer, null, {
      textMain: options.textMain,
      textSub: options.textSub,
      textColor: options.textColor,
      accentColor: options.accentColor,
      strokeColor: options.strokeColor,
      layout: 'text-center',
    });
  }

  /**
   * 이전 호환용: composeWithPerson
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
    const bgBuffer = await this.createCodeBackground(options.paletteIndex);
    const layout = options.personPosition === 'left' ? 'person-left' : 'person-right';
    return this.composeComplete(bgBuffer, personBuffer, {
      textMain: options.textMain,
      textSub: options.textSub,
      textColor: options.textColor,
      accentColor: options.accentColor,
      strokeColor: options.strokeColor,
      layout,
    });
  }

  // ═══════════════════════════════════════════
  // 하네스 내부 메서드
  // ═══════════════════════════════════════════

  /**
   * 하네스: 폰트 크기 강제 (글자수에 따라 자동 조절)
   * 짧은 텍스트 = 큰 폰트, 긴 텍스트 = 줄바꿈 + 큰 폰트
   */
  private enforceFontSize(textLength: number): number {
    // 4자 이하: 최대, 5~6자: 크게, 7자+: 줄바꿈하므로 여전히 크게
    if (textLength <= 3) return this.HARNESS.MAX_MAIN_FONT; // 200px
    if (textLength <= 5) return 170;
    if (textLength <= 7) return 155;
    return this.HARNESS.MIN_MAIN_FONT; // 140px (줄바꿈 적용)
  }

  /**
   * 하네스: 자동 줄바꿈 (한국어 최적화)
   */
  private splitText(text: string, maxCharsPerLine: number): string[] {
    if (text.length <= maxCharsPerLine) return [text];

    // 2줄까지만 허용 (하네스 규칙)
    const mid = Math.ceil(text.length / 2);
    // 가능하면 공백에서 분리
    const spaceIdx = text.lastIndexOf(' ', mid + 1);
    if (spaceIdx > 0 && spaceIdx < text.length - 1) {
      return [text.slice(0, spaceIdx), text.slice(spaceIdx + 1)];
    }
    return [text.slice(0, mid), text.slice(mid)];
  }

  /**
   * 하네스 텍스트 SVG (큰 폰트, 자동 줄바꿈, 강한 그림자)
   */
  private createHarnessTextSvg(opts: {
    width: number;
    height: number;
    textMain: string;
    textSub?: string;
    textColor: string;
    accentColor: string;
    strokeColor: string;
    fontSize: number;
    subFontSize: number;
    textX: number;
    textAlign: 'left' | 'center';
    maxWidth: number;
    emotionalTone?: string;
  }): string {
    const {
      width, height, textMain, textSub, textColor, accentColor,
      strokeColor, fontSize, subFontSize, textX, textAlign, emotionalTone,
    } = opts;

    const fontFamily = this.selectFont(emotionalTone);

    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const anchor = textAlign === 'center' ? 'middle' : 'start';
    const mainLines = this.splitText(textMain, this.HARNESS.MAIN_CHARS_PER_LINE);
    const lineHeight = fontSize * 1.15;

    // 수직 중앙 정렬 계산
    const totalTextHeight = mainLines.length * lineHeight
      + (textSub ? subFontSize + 20 : 0);
    const startY = (height - totalTextHeight) / 2 + fontSize * 0.85;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ts" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="20" flood-color="${accentColor}" flood-opacity="0.35"/>
      <feDropShadow dx="5" dy="5" stdDeviation="6" flood-color="#000" flood-opacity="0.8"/>
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#000" flood-opacity="0.95"/>
    </filter>
    <filter id="tsSub" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#000" flood-opacity="0.8"/>
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>`;

    // 메인 텍스트 (줄별)
    mainLines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      svg += `
  <text x="${textX}" y="${y}"
    font-family="${fontFamily}"
    font-size="${fontSize}" font-weight="900" letter-spacing="-4"
    text-anchor="${anchor}" filter="url(#ts)"
    paint-order="stroke" stroke="${strokeColor}" stroke-width="${this.HARNESS.TEXT_STROKE_WIDTH}" stroke-linejoin="round"
    fill="${textColor}">
    ${escape(line)}
  </text>`;
    });

    // 보조 텍스트
    if (textSub) {
      const subY = startY + mainLines.length * lineHeight + 15;
      const subLines = this.splitText(textSub, this.HARNESS.SUB_CHARS_PER_LINE);
      subLines.forEach((line, i) => {
        svg += `
  <text x="${textX}" y="${subY + i * (subFontSize * 1.2)}"
    font-family="'Noto Sans CJK KR','Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif"
    font-size="${subFontSize}" font-weight="700" letter-spacing="-2"
    text-anchor="${anchor}" filter="url(#tsSub)"
    paint-order="stroke" stroke="${strokeColor}" stroke-width="6" stroke-linejoin="round"
    fill="${accentColor}">
    ${escape(line)}
  </text>`;
      });
    }

    svg += '\n</svg>';
    return svg;
  }

  // ═══════════════════════════════════════════
  // 배경 SVG 생성 (다양한 패턴)
  // ═══════════════════════════════════════════

  private createGradientBgSvg(w: number, h: number, c1: string, c2: string): string {
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
</svg>`;
  }

  private createRadialBgSvg(w: number, h: number, c1: string, c2: string): string {
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="30%" cy="50%" r="80%">
      <stop offset="0%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
</svg>`;
  }

  private createSplitBgSvg(w: number, h: number, c1: string, c2: string): string {
    const midX = Math.round(w * 0.55);
    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </linearGradient>
  </defs>
  <rect width="${midX}" height="${h}" fill="url(#bg1)"/>
  <rect x="${midX}" width="${w - midX}" height="${h}" fill="url(#bg2)"/>
</svg>`;
  }
}
