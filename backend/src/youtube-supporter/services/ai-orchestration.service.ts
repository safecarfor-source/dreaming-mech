import { Injectable, Logger } from '@nestjs/common';

// Anthropic 타입 정의 (패키지 없을 때도 컴파일 가능하도록 인라인 정의)
interface AnthropicMessage {
  content: Array<{ type: string; text?: string }>;
}

interface AnthropicClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: string; content: string }>;
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

  /**
   * 썸네일 독립 시스템 — 학습된 규칙 기반 텍스트 전략 생성
   * 대장님이 "썸네일 제작" 버튼 클릭 시 호출
   */
  async generateThumbnailStrategy(
    projectTitle: string,
    coreValue: string,
    thumbnailKnowledge: string,
  ): Promise<{ strategies: string[] }> {
    const knowledgeSection = thumbnailKnowledge
      ? `\n\n참고할 썸네일 학습 자료:\n${thumbnailKnowledge.slice(0, 2000)}`
      : '';

    const prompt = `당신은 유튜브 썸네일 전문가입니다.
주제: "${projectTitle}"
코어벨류: ${coreValue}
${knowledgeSection}

아래 3가지 방식으로 썸네일 텍스트 전략을 제안해주세요.
각 전략마다 다음을 포함하세요:
- 메인 문구 (7자 이내, 강렬하게)
- 서브 문구 (필요시)
- 레이아웃 설명 (텍스트 위치, 인물/배경 구성)
- 색상 조합 (배경색 + 텍스트색)
- 왜 이 전략이 클릭을 유도하는지 설명

STRATEGY_1: (감정 자극형)
STRATEGY_2: (숫자/통계형)
STRATEGY_3: (비교/대조형)`;

    const response = await this.analyzeWithSonnet(prompt);

    const strategies = [
      response.match(/STRATEGY_1:\s*([\s\S]+?)(?=STRATEGY_2:|$)/)?.[1]?.trim() ?? '',
      response.match(/STRATEGY_2:\s*([\s\S]+?)(?=STRATEGY_3:|$)/)?.[1]?.trim() ?? '',
      response.match(/STRATEGY_3:\s*([\s\S]+?)$/)?.[1]?.trim() ?? '',
    ].filter((s) => s.length > 0);

    return { strategies };
  }

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

  private extractText(content: Array<{ type: string; text?: string }>): string {
    return content
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('');
  }
}
