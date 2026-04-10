import { Injectable, Logger } from '@nestjs/common';

// Anthropic 타입 정의 (패키지 없을 때도 컴파일 가능하도록 인라인 정의)
type ContentBlock = { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

interface AnthropicMessage {
  content: Array<{ type: string; text?: string }>;
}

interface AnthropicClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: string; content: string | ContentBlock[] }>;
    }): Promise<AnthropicMessage>;
  };
}

interface AnthropicConstructor {
  new (options: { apiKey: string }): AnthropicClient;
}

export interface ReferenceVideoContext {
  videoId: string;
  title: string;
  channelName: string;
  transcript: string;
  viewSubRatio: number;
  language: string;
}

export interface CommentContext {
  comments: Array<{ text: string; likeCount: number }>;
}

export interface ProductionResult {
  coreValue: string;
  introSources: {
    commentThemes: string[];
    introDraft: string;
  };
  introDrafts: string[];
  scriptDraft: string;
  thumbnailStrategies: string[];
  titles: string[];
  hashtags: string[];
  description: string;
  opusReview: string;
}

/**
 * Anthropic AI 오케스트레이션 서비스
 * 모델별 역할 분리:
 *   - Sonnet: 분석/생성/메타데이터
 *   - Opus: 대본 작성 + 최종 검수
 */
@Injectable()
export class AiOrchestrationService {
  private readonly logger = new Logger(AiOrchestrationService.name);
  private client: AnthropicClient | null = null;
  private AnthropicClass: AnthropicConstructor | null = null;

  constructor() {
    this.loadAnthropicSdk();
  }

  private loadAnthropicSdk() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sdk = require('@anthropic-ai/sdk') as { default?: AnthropicConstructor; Anthropic?: AnthropicConstructor };
      this.AnthropicClass = (sdk.default ?? sdk.Anthropic) ?? null;
    } catch {
      this.logger.warn('@anthropic-ai/sdk 패키지를 찾을 수 없습니다. mock 모드로 동작합니다.');
    }
  }

  private get isMockMode(): boolean {
    return !this.AnthropicClass || !process.env.ANTHROPIC_API_KEY;
  }

  private getClient(): AnthropicClient | null {
    if (!this.client && this.AnthropicClass && process.env.ANTHROPIC_API_KEY) {
      this.client = new this.AnthropicClass({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  /**
   * Sonnet 모델 — 분석/생성 메인 작업
   */
  async analyzeWithSonnet(prompt: string): Promise<string> {
    if (this.isMockMode) {
      this.logger.warn('ANTHROPIC_API_KEY 미설정 — mock 응답 반환 (Sonnet)');
      return `[MOCK Sonnet 응답]\n${prompt.slice(0, 100)}...`;
    }

    const client = this.getClient();
    if (!client) return '[AI 클라이언트 초기화 실패]';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    return this.extractText(message.content);
  }

  /**
   * Sonnet 모델 — 보조 생성 작업 (메타데이터 등)
   * (기존 Haiku 역할을 Sonnet으로 통합)
   */
  async generateWithSonnet(prompt: string): Promise<string> {
    return this.analyzeWithSonnet(prompt);
  }

  /**
   * Opus 모델 — 대본 작성 (핵심 아웃풋, 최고 품질)
   */
  async generateWithOpus(prompt: string): Promise<string> {
    if (this.isMockMode) {
      this.logger.warn('ANTHROPIC_API_KEY 미설정 — mock 응답 반환 (Opus 대본)');
      return `[MOCK Opus 대본]\n${prompt.slice(0, 100)}...`;
    }

    const client = this.getClient();
    if (!client) return '[AI 클라이언트 초기화 실패]';

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    return this.extractText(message.content);
  }

  /**
   * Opus 모델 — 최종 검수
   */
  async reviewWithOpus(content: string): Promise<string> {
    if (this.isMockMode) {
      this.logger.warn('ANTHROPIC_API_KEY 미설정 — mock 응답 반환 (Opus)');
      return `[MOCK Opus 검수 결과]\n전반적으로 좋은 콘텐츠입니다. 개선점: ...`;
    }

    const client = this.getClient();
    if (!client) return '[AI 클라이언트 초기화 실패]';

    const prompt = `다음 유튜브 콘텐츠를 최고 수준으로 검수해주세요.
개선점, 강점, 최종 권고사항을 구체적으로 제시해주세요.

---
${content}
---

검수 기준:
1. 인트로 30초의 후킹력 (시청 이탈 방지)
2. 대본의 논리적 흐름과 명확성
3. 썸네일 문구의 클릭 유도력
4. 제목의 검색 최적화(SEO) + 감정 자극
5. 전체적인 완성도`;

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    return this.extractText(message.content);
  }

  /**
   * 제작 전체 파이프라인 실행 (STEP 2~5)
   */
  async runProductionPipeline(
    projectTitle: string,
    referenceVideos: ReferenceVideoContext[],
    comments: CommentContext,
  ): Promise<ProductionResult> {
    this.logger.log(`제작 파이프라인 시작: ${projectTitle}`);

    // STEP 2-1: 레퍼런스 영상 자막 분석 (Sonnet)
    const transcriptAnalysis = await this.analyzeTranscripts(projectTitle, referenceVideos);

    // STEP 2-2: 댓글 분석 (Sonnet)
    const commentAnalysis = await this.analyzeComments(projectTitle, comments);

    // STEP 3: 코어벨류 + 대본 초안 (Opus)
    let { coreValue, scriptDraft, introDrafts } = await this.generateScript(
      projectTitle,
      transcriptAnalysis,
      commentAnalysis,
    );

    // STEP 3-V: 대본 자동 검증 + 최대 2회 자동 재작성
    const MAX_RETRY = 2;
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      const validation = this.validateScript(scriptDraft);

      if (validation.passed) {
        this.logger.log(`대본 검증 통과 (시도 ${attempt === 1 ? '1회차' : `재작성 ${attempt - 1}회`})`);
        break;
      }

      this.logger.warn(
        `대본 검증 실패 (시도 ${attempt}/${MAX_RETRY}) — 오류: ${validation.errors.join(' | ')}`,
      );

      if (attempt === MAX_RETRY) {
        // 마지막 시도에도 실패하면 경고만 남기고 진행 (파이프라인 중단 방지)
        this.logger.error(
          `대본 검증 ${MAX_RETRY}회 모두 실패. 검증 미통과 상태로 파이프라인 계속 진행.`,
        );
        break;
      }

      // 검증 피드백을 원본 프롬프트에 합쳐서 Opus에게 재작성 요청
      this.logger.log(`대본 재작성 요청 (${attempt}/${MAX_RETRY - 1}회차 재시도)`);
      const feedbackPrompt = `당신은 20년 경력의 자동차 정비사이자 유튜버 "꿈꾸는정비사" (구독자 52K)입니다.
주제: "${projectTitle}"

레퍼런스 영상 분석 결과:
${transcriptAnalysis.slice(0, 3000)}

시청자 댓글 인사이트:
- 공통 관심사: ${commentAnalysis.themes.join(', ')}
- 댓글 기반 인트로 힌트: ${commentAnalysis.introDraft}

아래 내용을 작성해주세요:

## 1. 코어벨류 (Core Value)
이 영상의 핵심 가치 제안: 시청자가 이 영상을 보면 얻는 것 (1~2문장)

## 2. 인트로 초안 3개 (각 30초 분량, 약 150자)
버전A: 문제 제기형
버전B: 공감형
버전C: 충격 통계형

## 3. 대본 초안
전체 약 8~10분 분량의 대본 (기-승-전-결 구조)
- 인트로 (30초)
- 본론 (6~8분)
- 아웃트로 (1분)

자연스러운 한국어 구어체로 작성해주세요.

---
[이전 대본 검증 피드백 — 반드시 수정하세요]
${validation.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}
---`;

      const retryResult = await this.generateScriptFromPrompt(feedbackPrompt);
      coreValue = retryResult.coreValue;
      scriptDraft = retryResult.scriptDraft;
      introDrafts = retryResult.introDrafts;
    }

    // STEP 4: 제목/해시태그/설명란 (Sonnet) — 썸네일은 독립 시스템으로 분리됨
    const { titles, hashtags, description } = await this.generateMetadata(
      projectTitle,
      coreValue,
      scriptDraft,
    );

    // STEP 5: Opus 최종 검수 (수동 요청 시만)
    // 자동 파이프라인에서는 생략 — 대장님이 "최종 검토" 요청 시 별도 실행
    const opusReview = '';

    return {
      coreValue,
      introSources: {
        commentThemes: commentAnalysis.themes,
        introDraft: commentAnalysis.introDraft,
      },
      introDrafts,
      scriptDraft,
      thumbnailStrategies: [], // 썸네일은 독립 시스템에서 별도 처리
      titles,
      hashtags,
      description,
      opusReview,
    };
  }

  /**
   * STEP 2-1: 레퍼런스 영상 자막 분석
   */
  private async analyzeTranscripts(
    projectTitle: string,
    videos: ReferenceVideoContext[],
  ): Promise<string> {
    const videoSummaries = videos
      .map(
        (v, i) => `
[영상 ${i + 1}] ${v.title} (채널: ${v.channelName}, 조회수/구독자 비율: ${v.viewSubRatio})
자막:
${v.transcript.slice(0, 3000)}
      `.trim(),
      )
      .join('\n\n---\n\n');

    const prompt = `당신은 유튜브 콘텐츠 전략 전문가입니다.
주제: "${projectTitle}"

아래 ${videos.length}개의 레퍼런스 영상을 분석해주세요.
각 영상에 대해 다음을 추출하세요:

1. **인트로 전략** (처음 30초): 어떻게 시청자를 붙잡았나?
2. **본문 구조**: 어떤 흐름으로 진행되었나?
3. **What to Say**: 핵심 메시지는 무엇인가?
4. **3막 9단계 구조 분석**: 기-승-전-결 관점에서 분해
5. **배울 점**: 내 영상에 적용할 수 있는 것

---
${videoSummaries}
---

분석 결과를 구체적으로 작성해주세요.`;

    return this.analyzeWithSonnet(prompt);
  }

  /**
   * STEP 2-2: 댓글 분석 → 인트로 소재 발굴
   */
  private async analyzeComments(
    projectTitle: string,
    comments: CommentContext,
  ): Promise<{ themes: string[]; introDraft: string }> {
    if (!comments.comments.length) {
      return { themes: [], introDraft: '' };
    }

    const commentText = comments.comments
      .slice(0, 50)
      .map((c) => `- (좋아요 ${c.likeCount}) ${c.text}`)
      .join('\n');

    const prompt = `당신은 유튜브 시청자 심리 전문가입니다.
주제: "${projectTitle}"

아래 댓글들을 분석하여 인트로 소재를 발굴해주세요.

댓글 목록:
${commentText}

분석 요청:
1. **공통 관심사/불만**: 시청자들이 가장 많이 언급하는 주제 5가지 (JSON 배열로)
2. **감정 분석**: 어떤 감정이 주를 이루는가?
3. **인트로 소재**: 이 댓글들을 활용한 30초 인트로 문구 (시청자의 공감을 이끄는 방식)

응답 형식:
THEMES: ["주제1", "주제2", "주제3", "주제4", "주제5"]
INTRO_DRAFT: (인트로 문구)`;

    const response = await this.analyzeWithSonnet(prompt);

    // 파싱
    const themesMatch = response.match(/THEMES:\s*(\[.*?\])/s);
    const introDraftMatch = response.match(/INTRO_DRAFT:\s*([\s\S]+?)(?:\n\n|$)/);

    let themes: string[] = [];
    try {
      themes = themesMatch ? (JSON.parse(themesMatch[1]) as string[]) : [];
    } catch {
      themes = [];
    }

    return {
      themes,
      introDraft: introDraftMatch?.[1]?.trim() ?? '',
    };
  }

  /**
   * 대본 자동 검증 하네스 (순수 코드 로직 — AI 미사용)
   *
   * 검증 규칙:
   * 1. 글자수: 2400~3000자 (8~10분 분량)
   * 2. 섹션 구조: 인트로/본론/아웃트로 존재 여부
   * 3. 금지어 필터: 비속어, 경쟁사 비하 표현
   * 4. 구어체 비율: 전체 문장 대비 10% 이상
   */
  validateScript(scriptDraft: string): { passed: boolean; errors: string[] } {
    const errors: string[] = [];

    // --- 규칙 1: 글자수 체크 (공백 포함) ---
    const charCount = scriptDraft.length;
    const MIN_CHARS = 2400;
    const MAX_CHARS = 3000;

    if (charCount < MIN_CHARS) {
      errors.push(
        `글자수 ${charCount.toLocaleString()}자 — 최소 ${MIN_CHARS.toLocaleString()}자 필요 (현재 ${MIN_CHARS - charCount}자 부족)`,
      );
    } else if (charCount > MAX_CHARS) {
      errors.push(
        `글자수 ${charCount.toLocaleString()}자 — 최대 ${MAX_CHARS.toLocaleString()}자 초과 (${charCount - MAX_CHARS}자 초과)`,
      );
    }

    // --- 규칙 2: 섹션 구조 체크 ---
    // 인트로 키워드
    const hasIntro = /인트로|시작|안녕하세요|오늘은|반갑습니다/i.test(scriptDraft);
    // 본론 키워드
    const hasMain =
      /본론|첫\s*번째|두\s*번째|1\.|2\.|먼저|그\s*다음|중요한\s*건|핵심은/i.test(
        scriptDraft,
      );
    // 아웃트로 키워드
    const hasOutro =
      /아웃트로|마무리|정리하면|오늘\s*영상|구독|좋아요|댓글|다음\s*영상|감사합니다/i.test(
        scriptDraft,
      );

    if (!hasIntro) {
      errors.push('섹션 구조 오류 — 인트로 섹션을 찾을 수 없습니다 (키워드: 인트로/시작/안녕하세요 등)');
    }
    if (!hasMain) {
      errors.push(
        '섹션 구조 오류 — 본론 섹션을 찾을 수 없습니다 (키워드: 첫 번째/두 번째/먼저/핵심은 등)',
      );
    }
    if (!hasOutro) {
      errors.push(
        '섹션 구조 오류 — 아웃트로 섹션을 찾을 수 없습니다 (키워드: 마무리/정리하면/구독/감사합니다 등)',
      );
    }

    // --- 규칙 3: 금지어 필터 ---
    // 비속어
    const profanityPatterns = [
      /씨[발팔]/,
      /개새끼/,
      /지랄/,
      /병[신신]/,
      /미친[놈년새]/,
      /존나/,
      /抄/,
    ];
    // 경쟁사 비하 표현
    const competitorBashPatterns = [
      /[현기아起아]차는\s*(최악|쓰레기|형편없)/i,
      /[수입외제]차\s*(호구|바보|호갱)/i,
      /(쓰레기|형편없는|최악의)\s*(차|브랜드|메이커)/i,
    ];

    const allForbiddenPatterns = [...profanityPatterns, ...competitorBashPatterns];
    const foundForbidden = allForbiddenPatterns.filter((pattern) => pattern.test(scriptDraft));

    if (foundForbidden.length > 0) {
      errors.push(`금지어 감지 — 비속어 또는 경쟁사 비하 표현이 포함되어 있습니다 (${foundForbidden.length}건)`);
    }

    // --- 규칙 4: 구어체 비율 체크 ---
    // 문장 단위로 분리 (마침표/물음표/느낌표 기준)
    const sentences = scriptDraft
      .split(/[.?!。]\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // 구어체 어미 패턴
    const colloquialPattern = /[요죠]$|니다$|거든요$|잖아요$|네요$|군요$|는데요$|해요$|이에요$|예요$/;
    const colloquialCount = sentences.filter((s) => colloquialPattern.test(s)).length;
    const totalSentences = sentences.length;
    const colloquialRatio = totalSentences > 0 ? colloquialCount / totalSentences : 0;
    const MIN_COLLOQUIAL_RATIO = 0.1; // 10%

    if (totalSentences > 0 && colloquialRatio < MIN_COLLOQUIAL_RATIO) {
      const pct = Math.round(colloquialRatio * 100);
      errors.push(
        `구어체 비율 ${pct}% — 최소 ${MIN_COLLOQUIAL_RATIO * 100}% 이상 필요 (현재 ${colloquialCount}/${totalSentences}문장만 구어체)`,
      );
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  }

  /**
   * STEP 3: 코어벨류 + 대본 초안 + 인트로 초안 생성
   */
  private async generateScript(
    projectTitle: string,
    transcriptAnalysis: string,
    commentAnalysis: { themes: string[]; introDraft: string },
  ): Promise<{ coreValue: string; scriptDraft: string; introDrafts: string[] }> {
    const prompt = `당신은 20년 경력의 자동차 정비사이자 유튜버 "꿈꾸는정비사" (구독자 52K)입니다.
주제: "${projectTitle}"

레퍼런스 영상 분석 결과:
${transcriptAnalysis.slice(0, 3000)}

시청자 댓글 인사이트:
- 공통 관심사: ${commentAnalysis.themes.join(', ')}
- 댓글 기반 인트로 힌트: ${commentAnalysis.introDraft}

아래 내용을 작성해주세요:

## 1. 코어벨류 (Core Value)
이 영상의 핵심 가치 제안: 시청자가 이 영상을 보면 얻는 것 (1~2문장)

## 2. 인트로 초안 3개 (각 30초 분량, 약 150자)
버전A: 문제 제기형
버전B: 공감형
버전C: 충격 통계형

## 3. 대본 초안
전체 약 8~10분 분량의 대본 (기-승-전-결 구조)
- 인트로 (30초)
- 본론 (6~8분)
- 아웃트로 (1분)

자연스러운 한국어 구어체로 작성해주세요.`;

    return this.generateScriptFromPrompt(prompt);
  }

  /**
   * Opus 응답 → 코어벨류/인트로초안/대본 파싱 (재사용 가능한 파싱 로직)
   * generateScript 최초 생성 + 검증 실패 시 재작성 모두 사용
   */
  private async generateScriptFromPrompt(
    prompt: string,
  ): Promise<{ coreValue: string; scriptDraft: string; introDrafts: string[] }> {
    const response = await this.generateWithOpus(prompt);

    // 코어벨류 추출
    const coreValueMatch = response.match(/## 1\. 코어벨류.*?\n([\s\S]+?)(?=## 2)/);
    const coreValue = coreValueMatch?.[1]?.trim() ?? response.slice(0, 200);

    // 인트로 초안 추출
    const introDraftsMatch = response.match(/## 2\. 인트로 초안.*?\n([\s\S]+?)(?=## 3)/);
    const introDraftsRaw = introDraftsMatch?.[1] ?? '';
    const introDrafts = introDraftsRaw
      .split(/버전[ABC]:/)
      .slice(1)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // 대본 초안 추출
    const scriptMatch = response.match(/## 3\. 대본 초안\n([\s\S]+)$/);
    const scriptDraft = scriptMatch?.[1]?.trim() ?? response;

    return { coreValue, scriptDraft, introDrafts };
  }

  /**
   * STEP 4: 메타데이터 생성 (Sonnet) — 제목/해시태그/설명만 (썸네일 독립)
   */
  private async generateMetadata(
    projectTitle: string,
    coreValue: string,
    scriptDraft: string,
  ): Promise<{
    titles: string[];
    hashtags: string[];
    description: string;
  }> {
    const prompt = `유튜브 주제: "${projectTitle}"
코어벨류: ${coreValue}
대본 요약: ${scriptDraft.slice(0, 500)}

아래 형식으로 생성해주세요. 각 항목에 실제 내용을 작성하세요. 괄호 안의 설명은 참고용이며 출력하지 마세요.

TITLE_1: 여기에 실제 제목을 적으세요 (SEO + 감정 자극 스타일, 50자 이내)
TITLE_2: 여기에 실제 제목을 적으세요 (숫자/통계 활용 스타일, 50자 이내)
TITLE_3: 여기에 실제 제목을 적으세요 (문제 제기형 스타일, 50자 이내)
HASHTAGS: #태그1 #태그2 #태그3 ... (최소 20개 이상, 관련 키워드 최대한 많이)
DESCRIPTION: 여기에 유튜브 설명란을 적으세요 (500자 내외, SEO 최적화, 타임라인 포함)

중요: TITLE_1, TITLE_2, TITLE_3에는 반드시 시청자가 클릭하고 싶은 실제 제목을 한국어로 작성하세요. "(SEO + 감정 자극)" 같은 카테고리 라벨이 아니라 실제 유튜브 제목이어야 합니다.`;

    const response = await this.generateWithSonnet(prompt);

    const extract = (pattern: RegExp) => {
      const match = response.match(pattern);
      return match?.[1]?.trim() ?? '';
    };

    const titles = [
      extract(/TITLE_1:\s*(.+)/),
      extract(/TITLE_2:\s*(.+)/),
      extract(/TITLE_3:\s*(.+)/),
    ].filter((s) => s.length > 0);

    const hashtagsRaw = extract(/HASHTAGS:\s*(.+)/);
    const hashtags = hashtagsRaw
      .split(/\s+/)
      .filter((t) => t.startsWith('#'))
      .map((t) => t.replace(/[,;]+$/, ''));

    const description = extract(/DESCRIPTION:\s*([\s\S]+?)(?:\n\n|$)/);

    return { titles, hashtags, description };
  }

  // generateThumbnailStrategy — 아래 썸네일 AI 섹션으로 이동됨

  /**
   * 대본 대화형 수정 — 사용자 피드백 기반으로 대본 개선
   */
  async refineScript(
    projectTitle: string,
    currentScript: string,
    userMessage: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const historyText = chatHistory
      .slice(-6) // 최근 6개 대화만
      .map((h) => `${h.role === 'user' ? '대장님' : 'AI'}: ${h.content}`)
      .join('\n\n');

    const prompt = `당신은 유튜브 영상 대본 전문 작가입니다. 20년 경력 자동차 정비사 "꿈꾸는 정비사" 채널의 대본을 함께 만들고 있습니다.

주제: "${projectTitle}"

현재 대본:
---
${currentScript.slice(0, 4000)}
---

${historyText ? `이전 대화:\n${historyText}\n\n` : ''}대장님 요청: ${userMessage}

위 요청을 반영하여 답변해주세요. 대본 전체를 다시 쓸 필요는 없고, 요청에 맞는 부분만 수정하거나 새로운 아이디어를 제안해주세요. 자연스럽고 대화하듯 답변하세요.`;

    return this.analyzeWithSonnet(prompt);
  }

  /**
   * 숏폼 구간 추천 — 자막 기반 AI 분석
   * 롱폼 영상의 자막을 분석해서 숏폼으로 만들기 좋은 구간 5개를 추천
   */
  async analyzeShortformSegments(
    transcript: string,
    videoTitle: string,
  ): Promise<{
    segments: Array<{
      id: number;
      startTime: string;
      endTime: string;
      hookTitle: string;
      subTitle: string;
      reason: string;
      hookScore: number;
      storyScore: number;
      viralScore: number;
      segments?: Array<{ start: string; end: string; label: string }>;
    }>;
  }> {
    const prompt = `당신은 유튜브 숏폼 전문 창작자입니다. 아래 롱폼 영상의 자막을 분석해서 숏폼(60초 이내)으로 만들기 좋은 구간 5개를 추천해주세요.

영상 제목: "${videoTitle}"

자막:
---
${transcript.slice(0, 12000)}
---

각 숏폼 구간에 대해 다음 JSON 배열로 응답해주세요. 반드시 유효한 JSON만 출력하세요.

[
  {
    "id": 1,
    "startTime": "00:00",
    "endTime": "00:45",
    "hookTitle": "첫 3초에 보여줄 큰 글씨 훅 타이틀 (15자 이내, 강렬하게)",
    "subTitle": "영상 하단에 표시할 서브타이틀 (20자 이내)",
    "reason": "왜 이 구간이 숏폼으로 좋은지 설명",
    "hookScore": 85,
    "storyScore": 70,
    "viralScore": 80,
    "segments": [
      {"start": "00:00", "end": "00:15", "label": "훅 도입"},
      {"start": "02:30", "end": "02:45", "label": "핵심 포인트"},
      {"start": "05:10", "end": "05:25", "label": "결론"}
    ]
  }
]

중요 규칙:
1. 첫 3초 훅이 가장 중요 — 말이 잘리면 절대 안 됨. 문장이 완전히 시작되는 지점에서 시작
2. 하나의 구간만 자르지 말고, 여러 구간을 합성해서 60초 숏폼을 만들 수 있도록 segments 배열 제공
3. hookTitle은 시청자가 이 영상을 왜 봐야 하는지 타당한 이유 + 호기심을 주는 방향
4. hookScore (첫인상 파워 0-100), storyScore (서사 구조 0-100), viralScore (바이럴 가능성 0-100)
5. 총 5개를 추천하되, 점수가 높은 순서로 정렬`;

    const response = await this.analyzeWithSonnet(prompt);

    // JSON 파싱
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { segments: parsed };
      }
    } catch (err) {
      this.logger.warn('숏폼 구간 JSON 파싱 실패, 원문 반환', err);
    }

    return { segments: [] };
  }

  /**
   * 타임라인 생성 (영상 완성 후)
   */
  async generateTimeline(projectTitle: string, scriptContent: string): Promise<string> {
    const prompt = `주제: "${projectTitle}"

아래 대본을 바탕으로 유튜브 영상 타임라인을 생성해주세요.
형식: 00:00 섹션 제목

규칙:
- 인트로는 항상 00:00에서 시작
- 각 섹션은 의미 있는 전환점에서 나눔
- 총 8~15개 섹션 권장
- 간결하고 검색 친화적인 제목 사용

대본:
${scriptContent.slice(0, 5000)}`;

    return this.analyzeWithSonnet(prompt);
  }

  /**
   * 학습 요청 처리 (URL/텍스트/파일 → 스킬 노트 생성)
   */
  async processLearningRequest(
    type: string,
    content: string,
    category: string,
  ): Promise<{ title: string; processedContent: string; tags: string[] }> {
    const prompt = `다음 ${type === 'url' ? 'URL 내용' : type === 'file' ? '파일 내용' : '텍스트'}에서 유튜브 제작 스킬을 추출해주세요.
카테고리: ${category}

내용:
${content.slice(0, 8000)}

응답 형식:
TITLE: (스킬 제목, 간결하게)
CONTENT: (핵심 내용 정리, 실무에 바로 적용 가능하게)
TAGS: tag1, tag2, tag3, tag4, tag5`;

    const response = await this.analyzeWithSonnet(prompt);

    const title = response.match(/TITLE:\s*(.+)/)?.[1]?.trim() ?? '학습 노트';
    const processedContent =
      response.match(/CONTENT:\s*([\s\S]+?)(?=TAGS:|$)/)?.[1]?.trim() ?? content;
    const tagsRaw = response.match(/TAGS:\s*(.+)/)?.[1] ?? '';
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    return { title, processedContent, tags };
  }

  /**
   * 주제 추천 (등록된 채널 + 최근 트렌드 분석 → 영상 주제 10개 추천)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async recommendTopics(channels: any[], recentVideos: any[]): Promise<string> {
    const channelList = channels
      .map((ch: { channelName: string; category: string; subscriberCount: number }) =>
        `- ${ch.channelName} (카테고리: ${ch.category}, 구독자: ${ch.subscriberCount?.toLocaleString()}명)`,
      )
      .join('\n');

    const videoList = recentVideos
      .slice(0, 20)
      .map((v: { title: string; channelName: string; viewSubRatio: number }) =>
        `- "${v.title}" (채널: ${v.channelName}, 조회/구독 비율: ${v.viewSubRatio})`,
      )
      .join('\n');

    const prompt = `당신은 자동차 유튜브 콘텐츠 전략 전문가입니다.

등록된 벤치마크 채널들:
${channelList || '(등록된 채널 없음)'}

최근 트렌딩 영상들:
${videoList || '(트렌딩 데이터 없음)'}

위 데이터를 바탕으로, 구독자 52K의 자동차 정비사 유튜버 "꿈꾸는정비사"를 위한 영상 주제 10개를 추천해주세요.
각 주제마다 추천 이유도 함께 제시해주세요.

형식:
1. [주제명]
   이유: (왜 이 주제가 지금 효과적인가)

2. [주제명]
   이유: ...`;

    return this.analyzeWithSonnet(prompt);
  }

  /**
   * 유사 채널 추천 (기존 등록 채널 기반)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async suggestChannels(existingChannels: any[]): Promise<string> {
    const channelList = existingChannels
      .map((ch: { channelName: string; category: string; description?: string }) =>
        `- ${ch.channelName} (카테고리: ${ch.category})${ch.description ? `: ${ch.description.slice(0, 100)}` : ''}`,
      )
      .join('\n');

    const prompt = `당신은 자동차 YouTube 채널 분석 전문가입니다.

현재 등록된 채널들:
${channelList || '(등록된 채널 없음)'}

위 채널들과 유사하거나 보완적인 자동차 관련 YouTube 채널 5개를 추천해주세요.
각 채널에 대해 채널명과 팔로우해야 하는 이유를 설명해주세요.

형식:
1. 채널명: [채널명]
   이유: (왜 이 채널을 참고해야 하는가)`;

    return this.generateWithSonnet(prompt);
  }

  // ─────────────────────────────────────────────
  // 썸네일 AI 기능
  // ─────────────────────────────────────────────

  /**
   * 썸네일 전략 생성 (Opus)
   * 가중치 기반 학습 데이터를 섹션별로 주입하여 전략 3안 제안
   */
  async generateThumbnailStrategy(
    projectTitle: string,
    coreValue?: string,
    scriptSummary?: string,
    learnedSections?: {
      verified?: string[];      // 검증된 성공 패턴 (score >= 3)
      expert?: string[];        // 전문가 노하우
      recentAnalysis?: string[]; // 최근 분석 인사이트
      positive?: string[];      // 효과적이었던 전략
      negative?: string[];      // 회피해야 할 패턴
    },
  ): Promise<string> {
    // 섹션별 학습 데이터 구성
    const sections: string[] = [];

    if (learnedSections?.verified?.length) {
      sections.push(`## ✅ 검증된 성공 패턴 (가장 중요 — 반드시 반영):\n${learnedSections.verified.map((k, i) => `${i + 1}. ${k}`).join('\n')}`);
    }
    if (learnedSections?.expert?.length) {
      sections.push(`## 🎓 전문가 노하우:\n${learnedSections.expert.map((k, i) => `${i + 1}. ${k}`).join('\n')}`);
    }
    if (learnedSections?.recentAnalysis?.length) {
      sections.push(`## 🔍 최근 분석 인사이트:\n${learnedSections.recentAnalysis.map((k, i) => `${i + 1}. ${k}`).join('\n')}`);
    }
    if (learnedSections?.positive?.length) {
      sections.push(`## 👍 효과적이었던 전략 (이 방향 추천):\n${learnedSections.positive.map((k, i) => `${i + 1}. ${k}`).join('\n')}`);
    }
    if (learnedSections?.negative?.length) {
      sections.push(`## 🚫 회피해야 할 패턴 (이 방향 지양):\n${learnedSections.negative.map((k, i) => `${i + 1}. ${k}`).join('\n')}`);
    }

    const knowledgeSection = sections.length
      ? `\n\n--- 학습된 노하우 (총 ${sections.length}개 섹션) ---\n${sections.join('\n\n')}`
      : '';

    const contextSection = [
      coreValue ? `코어벨류: ${coreValue}` : '',
      scriptSummary ? `대본 요약: ${scriptSummary}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `당신은 유튜브 썸네일 전문가입니다. 20년 경력 자동차 정비사 채널 "꿈꾸는정비사" (구독자 52K)의 썸네일 전략을 수립해주세요.

## 프로젝트 정보:
주제: ${projectTitle}
${contextSection}
${knowledgeSection}

## 제작 방식 (이해 필수):
- 배경: DALL-E 3로 생성 (배경만, 텍스트/인물 없이)
- 인물: 실사 정비사 사진을 배경 위에 합성 (주로 오른쪽)
- 텍스트: 코드로 큰 글씨 합성 (140~200px 한글, 왼쪽 배치)
- 따라서 배경 프롬프트는 인물+텍스트 공간을 비워둬야 함

## 요청사항:
아래 형식의 JSON으로 정확히 3개의 전략을 제안해주세요.

\`\`\`json
{
  "strategies": [
    {
      "concept": "전략 이름 (예: 긴급 경고형)",
      "description": "한줄 설명",
      "textMain": "메인 텍스트 (5자 이내! 짧을수록 좋음)",
      "textSub": "보조 텍스트 (선택, 8자 이내)",
      "personPosition": "right 또는 left (인물 위치, 대부분 right 추천)",
      "colorScheme": {
        "textColor": "메인 텍스트 HEX (밝은 색, 예: #FFFFFF)",
        "accentColor": "보조 텍스트 HEX (강조색, 예: #FFD700)"
      },
      "emotionalTone": "감정 톤 (긴급, 놀람, 신뢰, 궁금증 등)",
      "fluxPrompt": "DALL-E 배경 이미지용 영문 프롬프트"
    }
  ]
}
\`\`\`

## 하네스 규칙 (반드시 준수):
1. **textMain은 5자 이내** — 예: "엔진오일", "이거 몰라?", "사기당함"
2. **textSub은 8자 이내** — 예: "정비사가 직접 알려드림", "이것만 알면 됩니다"
3. **fluxPrompt 규칙** (매우 중요):
   - 반드시 영어로 작성
   - "YouTube thumbnail background, 1792x1024, photorealistic" 포함
   - **배경만 생성** — 텍스트/글자/사람 절대 포함 금지
   - "absolutely no text, no letters, no words, no people, no faces, no characters, no writing" 반드시 포함
   - 어두운 톤 배경 위주 (텍스트 가독성 확보)
   - 관련 소품/오브제 1~2개만 배치 (자동차 부품, 공구, 엔진 등)
   - 왼쪽 40%는 텍스트 공간, 오른쪽 40%는 인물 공간 → 중앙에 소품 배치
   - "studio lighting, dark moody background, automotive workshop aesthetic"
   - DALL-E 3 최적화: 프롬프트 끝에 "CRITICAL: This image must contain absolutely zero text of any kind" 추가
4. **colorScheme.textColor**: 반드시 밝은 색 (#FFFFFF, #FFD700 등 — 어두운 배경에서 눈에 띄게)
5. **personPosition**: 대부분 "right" 추천 (왼쪽 텍스트 + 오른쪽 인물 = 검증된 레이아웃)
6. 학습된 노하우가 있다면 반드시 반영 (특히 ✅ 검증된 패턴, 🚫 회피 패턴)
7. **고대비 색상 우선** — 빨강(#FF0000), 노랑(#FFD700), 주황(#FF6600)이 유튜브 흰색 UI와 가장 대비됨. accentColor는 이 3색 중 하나 권장
8. **얼굴 40%+ 규칙** — personPosition은 반드시 "right" 또는 "left"로 지정. 인물이 화면의 40% 이상을 차지해야 시선 유도 효과 극대화. text-center(인물 없는 레이아웃)는 예외적 상황에서만
9. **3안 배경 다양성** — 3개 전략의 fluxPrompt는 각각 완전히 다른 분위기여야 함 (예: 정비소 내부 vs 엔진 클로즈업 vs 도로 배경). 같은 분위기 반복 금지
10. **모바일 가독성 최우선** — 시청자 70%가 모바일. textMain은 3~5단어(12자 미만). 100px 너비 모바일 화면에서도 읽혀야 함

## A/B 테스트 원칙 (3안 차별화):
- 전략 1: **감정 호소형** — 놀람/위기감/긴급 ("이러면 폐차!", "큰일남!")
- 전략 2: **정보 전달형** — 궁금증/실용 ("이것만 알면", "원인은 이거")
- 전략 3: **대비 극대화형** — 색상 대비 최강, 가장 시각적으로 임팩트 있는 구성
- 3안은 서로 완전히 다른 접근이어야 함 (같은 분위기/톤 반복 절대 금지)`;

    return this.generateWithOpus(prompt);
  }

  /**
   * 학습 데이터에서 공통 패턴/인사이트 자동 추출
   */
  async extractInsightsFromAnalyses(analyses: Array<{ content: string; structuredData?: Record<string, unknown> }>): Promise<string> {
    if (this.isMockMode) {
      return JSON.stringify({
        insights: [
          { title: 'Mock 인사이트', content: '테스트용 패턴입니다.', tags: ['mock'] },
        ],
      });
    }

    const dataSection = analyses.map((a, i) => {
      if (a.structuredData) {
        return `분석 ${i + 1}: ${JSON.stringify(a.structuredData)}`;
      }
      return `분석 ${i + 1}: ${a.content}`;
    }).join('\n\n');

    const prompt = `당신은 유튜브 썸네일 데이터 분석 전문가입니다.

아래 ${analyses.length}개의 썸네일 분석 결과에서 공통 패턴과 실행 가능한 인사이트를 추출해주세요.

${dataSection}

## 요청사항:
아래 JSON 형식으로 3~5개의 핵심 인사이트를 추출해주세요.

\`\`\`json
{
  "insights": [
    {
      "title": "인사이트 제목 (예: 좌우 분할 구도가 가장 효과적)",
      "content": "구체적 설명 + 적용 방법 (2-3문장)",
      "tags": ["태그1", "태그2"]
    }
  ]
}
\`\`\`

중요:
- 구체적이고 실행 가능한 인사이트만 추출
- "빨간색이 많다" → "빨간색 배경 + 흰색 텍스트 조합이 긴급감을 줌" 수준으로 구체화
- 반복되는 패턴에 높은 우선순위`;

    return this.generateWithOpus(prompt);
  }

  /**
   * Claude Vision(Opus)으로 레퍼런스 썸네일 분석
   */
  async analyzeThumbnailImage(imageBase64: string, mediaType: string, userNote?: string): Promise<string> {
    if (this.isMockMode) {
      this.logger.warn('ANTHROPIC_API_KEY 미설정 — mock Vision 분석 반환');
      return JSON.stringify({
        layout: 'left-text-right-image',
        colorScheme: { primary: '#FFD700', background: '#1a1a2e' },
        textStrategy: { hookText: '예시 문구', placement: 'left-center' },
        emotionalTone: '긴급',
        effectivenessReason: 'Mock 분석 결과입니다.',
      });
    }

    const client = this.getClient();
    if (!client) return '[AI 클라이언트 초기화 실패]';

    const userNoteSection = userNote ? `\n\n전문가 메모: ${userNote}` : '';

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `이 유튜브 썸네일을 분석해주세요. 아래 JSON 형식으로 응답해주세요.
${userNoteSection}

\`\`\`json
{
  "layout": "구도 유형 (예: left-text-right-image, center-focus, split-contrast)",
  "colorScheme": {
    "primary": "주요 색상 HEX",
    "accent": "강조 색상 HEX",
    "background": "배경 색상 HEX"
  },
  "textStrategy": {
    "hookText": "메인 텍스트 내용",
    "subText": "보조 텍스트 (있으면)",
    "fontStyle": "폰트 스타일 설명",
    "placement": "텍스트 위치"
  },
  "emotionalTone": "감정 톤 (긴급, 놀람, 신뢰, 궁금증 등)",
  "compositionNotes": "구도 특징 (인물 배치, 시선 처리 등)",
  "effectivenessReason": "이 썸네일이 효과적인 이유 (2-3줄)"
}
\`\`\``,
          },
        ],
      }],
    });

    return this.extractText(message.content);
  }

  private extractText(content: Array<{ type: string; text?: string }>): string {
    return content
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('');
  }
}
