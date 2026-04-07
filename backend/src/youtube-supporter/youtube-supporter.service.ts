import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeApiService } from './services/youtube-api.service';
import { TranscriptService } from './services/transcript.service';
import { AiOrchestrationService } from './services/ai-orchestration.service';
import { ReplicateService } from './services/replicate.service';
import type {
  CreateProjectDto,
  UpdateProjectDto,
  SearchVideoDto,
  TranscriptDto,
  ProduceDto,
  TimelineDto,
  CreateSkillNoteDto,
  LearnDto,
  ExternalSaveDto,
  CreateChannelDto,
  UpdateChannelDto,
  DiscoverChannelVideosDto,
  DiscoverKeywordDto,
  DiscoverFindChannelsDto,
  ThumbnailStrategyDto,
  ThumbnailGenerateDto,
  ThumbnailSaveDto,
  ThumbnailAnalyzeDto,
  ThumbnailFeedbackDto,
  ThumbnailMemoryDto,
} from './schemas/youtube-supporter.schema';
import { YtProjectStatus, Prisma } from '@prisma/client';

// 제작 작업 상태 추적 (인메모리)
interface ProductionJob {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  error?: string;
}

@Injectable()
export class YouTubeSupporterService {
  private readonly logger = new Logger(YouTubeSupporterService.name);
  // 프로젝트별 제작 작업 상태 (인메모리)
  private readonly productionJobs = new Map<string, ProductionJob>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly youtubeApi: YoutubeApiService,
    private readonly transcript: TranscriptService,
    private readonly aiOrchestration: AiOrchestrationService,
    private readonly replicate: ReplicateService,
  ) {}

  // ─────────────────────────────────────────────
  // 프로젝트 CRUD
  // ─────────────────────────────────────────────

  async getProjects(status?: string) {
    const where =
      status === 'COMPLETED'
        ? { status: YtProjectStatus.COMPLETED }
        : status === 'IN_PROGRESS'
          ? { status: YtProjectStatus.IN_PROGRESS }
          : {};

    const projects = await this.prisma.ytProject.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        referenceVideos: {
          select: {
            id: true,
            title: true,
            channelName: true,
            viewSubRatio: true,
            thumbnailUrl: true,
            language: true,
          },
          orderBy: { viewSubRatio: 'desc' },
        },
        productionData: {
          select: {
            id: true,
            version: true,
            coreValue: true,
            updatedAt: true,
          },
          orderBy: { version: 'asc' },
        },
      },
    });

    return { success: true, data: projects };
  }

  async createProject(dto: CreateProjectDto) {
    const project = await this.prisma.ytProject.create({
      data: {
        title: dto.title,
        shootingDate: dto.shootingDate ? new Date(dto.shootingDate) : null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return { success: true, data: project };
  }

  async getProject(id: string) {
    const project = await this.prisma.ytProject.findUnique({
      where: { id },
      include: {
        referenceVideos: {
          orderBy: { viewSubRatio: 'desc' },
        },
        productionData: {
          orderBy: { version: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`프로젝트를 찾을 수 없습니다: ${id}`);
    }

    return { success: true, data: project };
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    await this.ensureProjectExists(id);

    const project = await this.prisma.ytProject.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.shootingDate !== undefined && {
          shootingDate: dto.shootingDate ? new Date(dto.shootingDate) : null,
        }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });

    return { success: true, data: project };
  }

  async completeProject(id: string) {
    await this.ensureProjectExists(id);

    const project = await this.prisma.ytProject.update({
      where: { id },
      data: { status: YtProjectStatus.COMPLETED },
    });

    return { success: true, data: project };
  }

  async reopenProject(id: string) {
    await this.ensureProjectExists(id);

    const project = await this.prisma.ytProject.update({
      where: { id },
      data: { status: YtProjectStatus.IN_PROGRESS },
    });

    return { success: true, data: project };
  }

  /**
   * 프로젝트 삭제 (Cascade로 레퍼런스/프로덕션도 삭제)
   */
  async deleteProject(id: string) {
    await this.ensureProjectExists(id);

    await this.prisma.ytProject.delete({
      where: { id },
    });

    return { success: true, message: '프로젝트가 삭제되었습니다' };
  }

  // ─────────────────────────────────────────────
  // YouTube 검색
  // ─────────────────────────────────────────────

  async searchVideos(dto: SearchVideoDto) {
    const results = await this.youtubeApi.searchVideos(
      dto.keyword,
      dto.language ?? 'ko',
      dto.maxResults ?? 10,
    );

    return { success: true, data: results };
  }

  async getVideoStats(videoId: string) {
    const stats = await this.youtubeApi.getVideoStats(videoId);
    return { success: true, data: stats };
  }

  async extractTranscript(dto: TranscriptDto) {
    const result = await this.transcript.getTranscript(dto.videoId, dto.language ?? 'ko');
    return { success: true, data: result };
  }

  // ─────────────────────────────────────────────
  // 제작 파이프라인 (STEP 2~5)
  // ─────────────────────────────────────────────

  async produce(projectId: string, dto: ProduceDto) {
    const project = await this.prisma.ytProject.findUnique({
      where: { id: projectId },
      include: {
        referenceVideos: {
          where: {
            id: { in: dto.referenceVideoIds },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`프로젝트를 찾을 수 없습니다: ${projectId}`);
    }

    if (!project.referenceVideos.length) {
      throw new BadRequestException('지정한 레퍼런스 영상을 찾을 수 없습니다');
    }

    // 이미 처리 중이면 중복 실행 방지
    const existingJob = this.productionJobs.get(projectId);
    if (existingJob?.status === 'PROCESSING') {
      return { success: true, data: { status: 'PROCESSING', message: '이미 분석이 진행 중입니다' } };
    }

    this.logger.log(`제작 시작: projectId=${projectId}, videos=${project.referenceVideos.length}개`);

    // 작업 상태를 PROCESSING으로 설정
    this.productionJobs.set(projectId, { status: 'PROCESSING', startedAt: new Date() });

    // 백그라운드에서 비동기 실행 (즉시 응답 반환)
    this.runProductionAsync(projectId, project).catch((err) => {
      this.logger.error(`제작 실패: projectId=${projectId}`, err);
      this.productionJobs.set(projectId, {
        status: 'FAILED',
        startedAt: this.productionJobs.get(projectId)?.startedAt ?? new Date(),
        error: err.message || '알 수 없는 오류',
      });
    });

    return {
      success: true,
      data: { status: 'PROCESSING', message: '분석을 시작했습니다. 잠시 후 결과를 확인해주세요.' },
    };
  }

  // 백그라운드 제작 파이프라인
  private async runProductionAsync(projectId: string, project: any) {
    // 레퍼런스 영상 컨텍스트 구성
    const referenceContext = project.referenceVideos.map((v: any) => ({
      videoId: v.videoId,
      title: v.title,
      channelName: v.channelName,
      transcript: v.transcript ?? '',
      viewSubRatio: v.viewSubRatio,
      language: v.language,
    }));

    // 댓글 수집 (첫 번째 영상 기준)
    const firstVideoId = project.referenceVideos[0]?.videoId;
    let comments: { comments: Array<{ text: string; likeCount: number }> } = { comments: [] };
    if (firstVideoId) {
      const rawComments = await this.youtubeApi.getVideoComments(firstVideoId, 100);
      comments = {
        comments: rawComments.map((c: any) => ({ text: c.text, likeCount: c.likeCount })),
      };
    }

    // 버전 1, 2 동시 생성 (병렬 실행)
    const [v1Result, v2Result] = await Promise.all([
      this.aiOrchestration.runProductionPipeline(project.title, referenceContext, comments),
      this.aiOrchestration.runProductionPipeline(project.title, referenceContext, comments),
    ]);

    // DB 저장 (upsert — 재실행 시 덮어씀)
    await Promise.all([
      this.prisma.ytProductionData.upsert({
        where: { projectId_version: { projectId, version: 1 } },
        create: {
          projectId,
          version: 1,
          ...this.mapProductionResult(v1Result),
        },
        update: this.mapProductionResult(v1Result),
      }),
      this.prisma.ytProductionData.upsert({
        where: { projectId_version: { projectId, version: 2 } },
        create: {
          projectId,
          version: 2,
          ...this.mapProductionResult(v2Result),
        },
        update: this.mapProductionResult(v2Result),
      }),
    ]);

    // 작업 완료
    this.productionJobs.set(projectId, {
      status: 'COMPLETED',
      startedAt: this.productionJobs.get(projectId)?.startedAt ?? new Date(),
    });

    this.logger.log(`제작 완료: projectId=${projectId}`);
  }

  async getProduction(projectId: string) {
    await this.ensureProjectExists(projectId);

    // 인메모리 작업 상태 확인
    const job = this.productionJobs.get(projectId);

    const productionData = await this.prisma.ytProductionData.findMany({
      where: { projectId },
      orderBy: { version: 'asc' },
    });

    // 작업 상태에 따른 응답
    if (job?.status === 'PROCESSING') {
      const elapsed = Math.floor((Date.now() - job.startedAt.getTime()) / 1000);
      return {
        success: true,
        data: productionData,
        status: 'PROCESSING',
        elapsed,
        message: `AI가 분석 중입니다... (${elapsed}초 경과)`,
      };
    }

    if (job?.status === 'FAILED') {
      return {
        success: false,
        data: productionData,
        status: 'FAILED',
        error: job.error,
        message: `분석 실패: ${job.error}`,
      };
    }

    return {
      success: true,
      data: productionData,
      status: productionData.length > 0 ? 'COMPLETED' : 'IDLE',
    };
  }

  // ─────────────────────────────────────────────
  // 타임라인
  // ─────────────────────────────────────────────

  async generateTimeline(projectId: string, dto: TimelineDto) {
    const project = await this.prisma.ytProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`프로젝트를 찾을 수 없습니다: ${projectId}`);
    }

    const timeline = await this.aiOrchestration.generateTimeline(
      project.title,
      dto.scriptContent,
    );

    // 해당 버전의 productionData에 타임라인 저장
    await this.prisma.ytProductionData.upsert({
      where: { projectId_version: { projectId, version: dto.version ?? 1 } },
      create: {
        projectId,
        version: dto.version ?? 1,
        timeline,
      },
      update: { timeline },
    });

    return { success: true, data: { timeline } };
  }

  // ─────────────────────────────────────────────
  // 숏폼 분석
  // ─────────────────────────────────────────────

  async analyzeShortform(dto: { videoUrl?: string; projectId?: string; transcript?: string }) {
    let transcriptText = dto.transcript || '';
    let videoTitle = '';

    // 1) 직접 자막 텍스트가 있으면 사용
    if (transcriptText) {
      videoTitle = '직접 입력';
    }
    // 2) videoUrl에서 자막 추출
    else if (dto.videoUrl) {
      const videoIdMatch = dto.videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (!videoIdMatch) {
        throw new BadRequestException('올바른 YouTube URL을 입력해주세요');
      }
      const videoId = videoIdMatch[1];

      // 영상 정보 가져오기
      try {
        const stats = await this.youtubeApi.getVideoStats(videoId);
        videoTitle = stats.title || videoId;
      } catch {
        videoTitle = videoId;
      }

      // 자막 추출
      const transcriptResult = await this.transcript.getTranscript(videoId);
      if (!transcriptResult.fullText) {
        throw new BadRequestException('이 영상에서 자막을 추출할 수 없습니다');
      }
      transcriptText = transcriptResult.fullText;
    }
    // 3) 프로젝트 대본 사용
    else if (dto.projectId) {
      const productionData = await this.prisma.ytProductionData.findFirst({
        where: { projectId: dto.projectId, version: 1 },
      });
      if (productionData?.scriptDraft) {
        transcriptText = productionData.scriptDraft;
      }
      const project = await this.prisma.ytProject.findUnique({
        where: { id: dto.projectId },
      });
      videoTitle = project?.title || '';
    }

    if (!transcriptText) {
      throw new BadRequestException('분석할 자막/대본이 없습니다');
    }

    this.logger.log(`숏폼 분석 시작: title="${videoTitle}", transcript=${transcriptText.length}자`);

    const result = await this.aiOrchestration.analyzeShortformSegments(
      transcriptText,
      videoTitle,
    );

    return {
      success: true,
      data: {
        videoTitle,
        transcriptLength: transcriptText.length,
        ...result,
      },
    };
  }

  // ─────────────────────────────────────────────
  // 대본 대화형 수정 + 직접 편집
  // ─────────────────────────────────────────────

  async updateProductionData(
    projectId: string,
    version: number,
    data: Record<string, any>,
  ) {
    await this.ensureProjectExists(projectId);

    // 허용 필드만 업데이트 (안전)
    const allowedFields = [
      'coreValue', 'introSources', 'introDrafts', 'scriptDraft',
      'thumbnailStrategies', 'titles', 'hashtags', 'description', 'timeline', 'opusReview',
    ];
    const filtered: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      if (allowedFields.includes(key)) {
        filtered[key] = data[key];
      }
    }

    const updated = await this.prisma.ytProductionData.update({
      where: { projectId_version: { projectId, version } },
      data: filtered,
    });

    return { success: true, data: updated };
  }

  async refineScript(
    projectId: string,
    dto: { message: string; version?: number; chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }> },
  ) {
    const project = await this.prisma.ytProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`프로젝트를 찾을 수 없습니다: ${projectId}`);
    }

    // 현재 대본 가져오기
    const productionData = await this.prisma.ytProductionData.findUnique({
      where: { projectId_version: { projectId, version: dto.version ?? 1 } },
    });

    const currentScript = productionData?.scriptDraft ?? '';

    const response = await this.aiOrchestration.refineScript(
      project.title,
      currentScript,
      dto.message,
      dto.chatHistory ?? [],
    );

    return { success: true, data: { response } };
  }

  // ─────────────────────────────────────────────
  // 스킬 노트
  // ─────────────────────────────────────────────

  async getSkillNotes(category?: string) {
    const where = category ? { category } : {};

    const notes = await this.prisma.ytSkillNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: notes };
  }

  async createSkillNote(dto: CreateSkillNoteDto) {
    const note = await this.prisma.ytSkillNote.create({
      data: {
        category: dto.category,
        title: dto.title,
        content: dto.content,
        source: dto.source ?? null,
        tags: dto.tags ?? [],
      },
    });

    return { success: true, data: note };
  }

  // ─────────────────────────────────────────────
  // 학습 요청
  // ─────────────────────────────────────────────

  async processLearnRequest(dto: LearnDto) {
    const { title, processedContent, tags } = await this.aiOrchestration.processLearningRequest(
      dto.type,
      dto.content,
      dto.category ?? 'other',
    );

    // 스킬 노트로 자동 저장
    const note = await this.prisma.ytSkillNote.create({
      data: {
        category: dto.category ?? 'other',
        title: dto.title ?? title,
        content: processedContent,
        source: dto.type === 'url' ? dto.content.slice(0, 500) : null,
        tags,
      },
    });

    return { success: true, data: note };
  }

  // ─────────────────────────────────────────────
  // 외부 연동 (클로드 앱 → DB 저장)
  // ─────────────────────────────────────────────

  async externalSave(dto: ExternalSaveDto) {
    const note = await this.prisma.ytSkillNote.create({
      data: {
        category: dto.category ?? 'other',
        title: dto.title,
        content: dto.content,
        source: dto.source ?? null,
        tags: dto.tags ?? [],
      },
    });

    return { success: true, data: note };
  }

  // ─────────────────────────────────────────────
  // 채널 CRUD (주제 찾기)
  // ─────────────────────────────────────────────

  async createChannel(dto: CreateChannelDto) {
    // YouTube API로 채널 정보 조회
    const channelInfo = await this.youtubeApi.getChannelInfo(dto.channelUrl);

    // 채널 영상 조회 → 평균 조회수 계산
    const videos = await this.youtubeApi.getChannelVideos(channelInfo.channelId, 50);
    const avgViewCount =
      videos.length > 0
        ? Math.round(videos.reduce((sum, v) => sum + v.viewCount, 0) / videos.length)
        : 0;

    const channel = await this.prisma.ytChannel.upsert({
      where: { channelId: channelInfo.channelId },
      create: {
        channelId: channelInfo.channelId,
        channelName: channelInfo.channelName,
        channelUrl: dto.channelUrl,
        thumbnailUrl: channelInfo.thumbnailUrl,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        category: dto.category ?? '정비',
        memo: dto.memo ?? null,
        avgViewCount,
        lastSyncedAt: new Date(),
      },
      update: {
        channelName: channelInfo.channelName,
        thumbnailUrl: channelInfo.thumbnailUrl,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        avgViewCount,
        lastSyncedAt: new Date(),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.memo !== undefined && { memo: dto.memo }),
      },
    });

    return { success: true, data: channel };
  }

  async getChannels(category?: string) {
    const where = category ? { category } : {};

    const channels = await this.prisma.ytChannel.findMany({
      where,
      orderBy: [{ category: 'asc' }, { channelName: 'asc' }],
    });

    return { success: true, data: channels };
  }

  async updateChannel(id: string, dto: UpdateChannelDto) {
    const channel = await this.prisma.ytChannel.findUnique({ where: { id } });
    if (!channel) {
      throw new NotFoundException(`채널을 찾을 수 없습니다: ${id}`);
    }

    const updated = await this.prisma.ytChannel.update({
      where: { id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.memo !== undefined && { memo: dto.memo }),
      },
    });

    return { success: true, data: updated };
  }

  async deleteChannel(id: string) {
    const channel = await this.prisma.ytChannel.findUnique({ where: { id } });
    if (!channel) {
      throw new NotFoundException(`채널을 찾을 수 없습니다: ${id}`);
    }

    await this.prisma.ytChannel.delete({ where: { id } });

    return { success: true, message: '채널이 삭제되었습니다' };
  }

  // ─────────────────────────────────────────────
  // 카테고리 CRUD
  // ─────────────────────────────────────────────

  async getCategories() {
    const categories = await this.prisma.ytCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return { success: true, data: categories };
  }

  async createCategory(name: string) {
    const existing = await this.prisma.ytCategory.findUnique({ where: { name } });
    if (existing) {
      throw new BadRequestException(`이미 존재하는 카테고리입니다: ${name}`);
    }

    const category = await this.prisma.ytCategory.create({
      data: { name },
    });

    return { success: true, data: category };
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.ytCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`카테고리를 찾을 수 없습니다: ${id}`);
    }

    await this.prisma.ytCategory.delete({ where: { id } });

    return { success: true, message: '카테고리가 삭제되었습니다' };
  }

  // ─────────────────────────────────────────────
  // 주제 찾기 (Discover)
  // ─────────────────────────────────────────────

  async discoverChannelVideos(dto: DiscoverChannelVideosDto) {
    const limit = dto.limit ?? 50;

    // 등록된 채널 조회 (카테고리 필터 선택)
    const channels = await this.prisma.ytChannel.findMany({
      where: dto.category ? { category: dto.category } : {},
    });

    if (!channels.length) {
      return { success: true, data: [] };
    }

    // 각 채널의 상위 영상 조회 + 평균 이상 필터
    const allResults: Array<{
      videoId: string;
      title: string;
      thumbnailUrl: string;
      viewCount: number;
      likeCount: number;
      publishedAt: string;
      channelId: string;
      channelName: string;
      subscriberCount: number;
      viewSubRatio: number;
    }> = [];

    await Promise.all(
      channels.map(async (ch) => {
        try {
          const videos = await this.youtubeApi.getChannelVideos(ch.channelId, 20, dto.videoDuration);
          const avgViewCount = ch.avgViewCount || 0;

          for (const v of videos) {
            // 평균 조회수 초과 영상만 필터
            if (v.viewCount > avgViewCount) {
              const viewSubRatio = this.youtubeApi.calculateViewSubRatio(
                v.viewCount,
                ch.subscriberCount,
              );
              allResults.push({
                ...v,
                channelId: ch.channelId,
                channelName: ch.channelName,
                subscriberCount: ch.subscriberCount,
                viewSubRatio,
              });
            }
          }
        } catch (err) {
          this.logger.warn(`채널 영상 조회 실패: ${ch.channelId}`, err);
        }
      }),
    );

    // viewSubRatio 내림차순 정렬 + 채널당 최대 3개 제한
    const sorted = allResults.sort((a, b) => b.viewSubRatio - a.viewSubRatio);
    const channelCount = new Map<string, number>();
    const MAX_PER_CHANNEL = 3;
    const diversified = sorted.filter((v) => {
      const count = channelCount.get(v.channelId) ?? 0;
      if (count >= MAX_PER_CHANNEL) return false;
      channelCount.set(v.channelId, count + 1);
      return true;
    }).slice(0, limit);

    return { success: true, data: diversified };
  }

  async discoverByKeyword(dto: DiscoverKeywordDto) {
    const maxResults = dto.maxResults ?? 50;
    const language = (dto.language ?? 'ko') as 'ko' | 'en';
    const duration = (dto.videoDuration as 'short' | 'medium' | 'long' | undefined) ?? undefined;

    // 캐시 키 생성
    const cacheKey = `${dto.keyword}:${language}:${duration ?? 'all'}`;

    // 캐시 조회 (6시간 TTL)
    const cached = await this.prisma.ytSearchCache.findUnique({
      where: { cacheKey },
    });

    if (cached && cached.expiresAt > new Date()) {
      this.logger.log(`캐시 히트: "${dto.keyword}" (${language}, ${duration ?? 'all'})`);
      return { success: true, data: cached.results };
    }

    // 캐시 미스 → YouTube API 호출
    const videos = await this.youtubeApi.searchVideos(dto.keyword, language, maxResults, duration);

    if (!videos.length) {
      return { success: true, data: [] };
    }

    // 고유 채널 ID 수집 후 채널 통계 조회 (구독자 + 총조회수 + 영상수)
    const uniqueChannelIds = [...new Set(videos.map((v) => v.channelId))];
    const channelStatsMap = new Map<string, { subscriberCount: number; totalViews: number; videoCount: number }>();

    await Promise.all(
      uniqueChannelIds.map(async (channelId) => {
        try {
          const stats = await this.youtubeApi.getChannelStats(channelId);
          channelStatsMap.set(channelId, stats);
        } catch {
          channelStatsMap.set(channelId, { subscriberCount: 0, totalViews: 0, videoCount: 0 });
        }
      }),
    );

    const results = videos
      .map((v) => {
        const stats = channelStatsMap.get(v.channelId) ?? { subscriberCount: 0, totalViews: 0, videoCount: 0 };
        const subscriberCount = stats.subscriberCount;
        return {
          ...v,
          subscriberCount,
          viewSubRatio: this.youtubeApi.calculateViewSubRatio(v.viewCount, subscriberCount),
          contribution: this.youtubeApi.calculateContributionScore(v.viewCount, stats.totalViews, stats.videoCount),
          performance: this.youtubeApi.calculatePerformanceScore(v.viewCount, subscriberCount),
          velocity: this.youtubeApi.calculateViewVelocity(v.viewCount, v.publishedAt),
          engagement: this.youtubeApi.calculateEngagementRate(v.likeCount, v.commentCount, v.viewCount),
        };
      })
      .sort((a, b) => b.viewSubRatio - a.viewSubRatio);

    // 결과를 캐시에 저장 (6시간 TTL)
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    await this.prisma.ytSearchCache.upsert({
      where: { cacheKey },
      update: { results: results as any, expiresAt },
      create: {
        cacheKey,
        keyword: dto.keyword,
        language,
        videoDuration: duration ?? null,
        results: results as any,
        expiresAt,
      },
    });

    this.logger.log(`캐시 저장: "${dto.keyword}" (${language}, ${duration ?? 'all'}) → ${results.length}개`);

    return { success: true, data: results };
  }

  async discoverTrending(maxResults?: number) {
    const results = await this.youtubeApi.getTrendingVideos('KR', maxResults ?? 50);
    return { success: true, data: results };
  }

  async discoverRecommend() {
    const channels = await this.prisma.ytChannel.findMany({
      orderBy: { channelName: 'asc' },
    });

    // 최근 트렌딩 영상 조회
    const trendingVideos = await this.youtubeApi.getTrendingVideos('KR', 20);

    const recommendation = await this.aiOrchestration.recommendTopics(channels, trendingVideos);

    return { success: true, data: { recommendation } };
  }

  async discoverFindChannels(dto: DiscoverFindChannelsDto) {
    const channels = await this.youtubeApi.searchChannels(dto.keyword, 10);
    return { success: true, data: channels };
  }

  // ─────────────────────────────────────────────
  // 레퍼런스 자동 추천
  // ─────────────────────────────────────────────

  /**
   * 프로젝트 주제 기반 YouTube 전체 검색 → viewSubRatio 상위 5개 추천
   */
  async suggestReferences(projectId: string) {
    const project = await this.ensureProjectExists(projectId);

    // YouTube 전체에서 주제 키워드로 검색 (한국어 + 영어)
    const [koVideos, enVideos] = await Promise.all([
      this.youtubeApi.searchVideos(project.title, 'ko', 25),
      this.youtubeApi.searchVideos(project.title, 'en', 25),
    ]);

    const allVideos = [...koVideos, ...enVideos];

    if (!allVideos.length) {
      return { success: true, data: [] };
    }

    // 고유 채널 ID → 구독자수 조회
    const uniqueChannelIds = [...new Set(allVideos.map((v) => v.channelId))];
    const subscriberMap = new Map<string, number>();

    await Promise.all(
      uniqueChannelIds.map(async (channelId) => {
        try {
          const stats = await this.youtubeApi.getChannelStats(channelId);
          subscriberMap.set(channelId, stats.subscriberCount);
        } catch {
          subscriberMap.set(channelId, 0);
        }
      }),
    );

    // viewSubRatio 계산 + 채널당 1개 제한 + 상위 5개
    const ranked = allVideos
      .map((v) => {
        const subscriberCount = subscriberMap.get(v.channelId) ?? 0;
        const viewSubRatio = this.youtubeApi.calculateViewSubRatio(v.viewCount, subscriberCount);
        return { ...v, subscriberCount, viewSubRatio };
      })
      .sort((a, b) => b.viewSubRatio - a.viewSubRatio);

    // 채널당 1개만 (다양한 소스)
    const channelSeen = new Set<string>();
    const top5 = ranked.filter((v) => {
      if (channelSeen.has(v.channelId)) return false;
      channelSeen.add(v.channelId);
      return true;
    }).slice(0, 10);

    return { success: true, data: top5 };
  }

  // ─────────────────────────────────────────────
  // 레퍼런스 직접 저장
  // ─────────────────────────────────────────────

  async addReferences(
    projectId: string,
    dto: {
      videos: Array<{
        videoId: string;
        title: string;
        channelName: string;
        channelId?: string;
        viewCount?: number;
        subscriberCount?: number;
        thumbnailUrl?: string;
      }>;
    },
  ) {
    // 프로젝트 존재 확인
    const project = await this.prisma.ytProject.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`프로젝트를 찾을 수 없습니다: ${projectId}`);
    }

    const created = await Promise.all(
      dto.videos.map(async (v) => {
        // 이미 존재하는지 확인 (중복 방지)
        const existing = await this.prisma.ytReferenceVideo.findFirst({
          where: { projectId, videoId: v.videoId },
        });
        if (existing) return existing;

        return this.prisma.ytReferenceVideo.create({
          data: {
            projectId,
            videoId: v.videoId,
            youtubeUrl: `https://youtube.com/watch?v=${v.videoId}`,
            title: v.title,
            channelName: v.channelName,
            channelId: v.channelId ?? '',
            viewCount: v.viewCount ?? 0,
            subscriberCount: v.subscriberCount ?? 0,
            thumbnailUrl: v.thumbnailUrl ?? null,
            viewSubRatio: this.youtubeApi.calculateViewSubRatio(v.viewCount ?? 0, v.subscriberCount ?? 0),
          },
        });
      }),
    );

    return { success: true, data: created };
  }

  // ─────────────────────────────────────────────
  // 숏폼 Phase 2: Python 서비스 프록시
  // ─────────────────────────────────────────────

  private get shortformServiceUrl(): string {
    return process.env.SHORTFORM_SERVICE_URL || 'http://shortform-maker:8000';
  }

  async shortformProcess(file: Express.Multer.File, token?: string): Promise<{ data: { jobId: string } }> {
    if (!file) {
      throw new BadRequestException('영상 파일이 없습니다');
    }

    const fs = await import('fs');
    const filePath = file.path; // 디스크 스토리지 경로

    try {
      const fileData = await fs.promises.readFile(filePath);
      const form = new FormData();
      const blob = new Blob([fileData], { type: file.mimetype || 'video/mp4' });
      form.append('video', blob, file.originalname || 'video.mp4');

      const headers: Record<string, string> = {};
      if (token) headers['x-yt-token'] = token;

      const res = await fetch(`${this.shortformServiceUrl}/shortform/process`, {
        method: 'POST',
        headers,
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new BadRequestException((err as any).detail || '숏폼 처리 시작 실패');
      }

      return res.json();
    } finally {
      // 임시 파일 삭제
      fs.promises.unlink(filePath).catch(() => {});
    }
  }

  async shortformJobStatus(jobId: string, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['x-yt-token'] = token;

    const res = await fetch(`${this.shortformServiceUrl}/shortform/job/${jobId}`, { headers });

    if (!res.ok) {
      throw new NotFoundException('잡을 찾을 수 없습니다');
    }

    return res.json();
  }

  async shortformDownload(jobId: string, index: string, token: string | undefined, res: import('express').Response): Promise<void> {
    const params = token ? `?token=${encodeURIComponent(token)}` : '';
    const headers: Record<string, string> = {};
    if (token) headers['x-yt-token'] = token;

    const upstream = await fetch(
      `${this.shortformServiceUrl}/shortform/download/${jobId}/${index}${params}`,
      { headers },
    );

    if (!upstream.ok) {
      res.status(upstream.status).json({ message: '다운로드 실패' });
      return;
    }

    res.set('Content-Type', 'video/mp4');
    res.set('Content-Disposition', `attachment; filename="shortform_clip_${index}.mp4"`);

    const { Readable } = await import('stream');
    const body = upstream.body;
    if (!body) {
      res.status(500).end();
      return;
    }
    const nodeStream = Readable.fromWeb(body as any);
    nodeStream.pipe(res);
  }

  // ─────────────────────────────────────────────
  // 숏폼 작업 DB 저장/조회
  // ─────────────────────────────────────────────

  async shortformSave(data: {
    projectId: string;
    externalJobId: string;
    status: string;
    fileName?: string;
    results?: any;
    error?: string;
  }) {
    // upsert: 같은 externalJobId가 있으면 업데이트
    const existing = await this.prisma.ytShortformJob.findFirst({
      where: { externalJobId: data.externalJobId },
    });

    if (existing) {
      const updated = await this.prisma.ytShortformJob.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          results: data.results ?? undefined,
          error: data.error ?? undefined,
        },
      });
      return { data: updated };
    }

    const created = await this.prisma.ytShortformJob.create({
      data: {
        projectId: data.projectId,
        externalJobId: data.externalJobId,
        status: data.status,
        fileName: data.fileName,
        results: data.results ?? undefined,
        error: data.error ?? undefined,
      },
    });
    return { data: created };
  }

  async shortformList(projectId: string) {
    const jobs = await this.prisma.ytShortformJob.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return { data: jobs };
  }

  async shortformJobDelete(id: string) {
    await this.prisma.ytShortformJob.delete({ where: { id } });
    return { data: { success: true } };
  }

  async shortformStorage() {
    const token = process.env.YT_PASSWORD || '';
    const upstream = await fetch(
      `${this.shortformServiceUrl}/shortform/storage`,
      { headers: { 'X-YT-Token': token } },
    );
    if (!upstream.ok) {
      return { data: [], totalSize: '0 MB' };
    }
    return upstream.json();
  }

  async shortformStorageDelete(jobId: string) {
    const token = process.env.YT_PASSWORD || '';
    const upstream = await fetch(
      `${this.shortformServiceUrl}/shortform/storage/${jobId}`,
      {
        method: 'DELETE',
        headers: { 'X-YT-Token': token },
      },
    );
    if (!upstream.ok) {
      const err = await upstream.text();
      throw new NotFoundException(err);
    }
    return upstream.json();
  }

  // ─────────────────────────────────────────────
  // 헬퍼
  // ─────────────────────────────────────────────

  private async ensureProjectExists(id: string) {
    const project = await this.prisma.ytProject.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`프로젝트를 찾을 수 없습니다: ${id}`);
    }
    return project;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapProductionResult(result: import('./services/ai-orchestration.service').ProductionResult): Record<string, any> {
    return {
      coreValue: result.coreValue,
      introSources: result.introSources,
      introDrafts: result.introDrafts,
      scriptDraft: result.scriptDraft,
      thumbnailStrategies: result.thumbnailStrategies,
      titles: result.titles,
      hashtags: result.hashtags,
      description: result.description,
      opusReview: result.opusReview,
    };
  }

  // ─────────────────────────────────────────────
  // 썸네일 AI
  // ─────────────────────────────────────────────

  /**
   * AI 썸네일 전략 생성
   */
  async generateThumbnailStrategy(dto: ThumbnailStrategyDto) {
    // 프로젝트 컨텍스트 가져오기
    let coreValue: string | undefined;
    let scriptSummary: string | undefined;
    let projectTitle = '유튜브 썸네일';

    if (dto.projectId) {
      const project = await this.prisma.ytProject.findUnique({
        where: { id: dto.projectId },
        include: { productionData: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      if (project) {
        projectTitle = project.title;
        const prod = project.productionData[0];
        if (prod) {
          coreValue = prod.coreValue ?? undefined;
          scriptSummary = prod.scriptDraft
            ? (prod.scriptDraft as string).slice(0, 500)
            : undefined;
        }
      }
    }

    // 학습된 썸네일 노하우 가져오기 (최근 20개)
    const skillNotes = await this.prisma.ytSkillNote.findMany({
      where: { category: 'thumbnail' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { content: true },
    });
    const learnedKnowledge = skillNotes.map((n) => n.content);

    // 커스텀 지시가 있으면 프로젝트 제목에 추가
    if (dto.customInstruction) {
      projectTitle = `${projectTitle}\n추가 지시: ${dto.customInstruction}`;
    }

    const rawResponse = await this.aiOrchestration.generateThumbnailStrategy(
      projectTitle,
      coreValue,
      scriptSummary,
      learnedKnowledge,
    );

    // JSON 파싱 시도
    try {
      const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawResponse;
      return JSON.parse(jsonStr);
    } catch {
      return { raw: rawResponse };
    }
  }

  /**
   * FLUX로 썸네일 배경 이미지 생성
   */
  async generateThumbnailImage(dto: ThumbnailGenerateDto) {
    const imageUrls = await this.replicate.generateImage(dto.prompt, {
      width: dto.width,
      height: dto.height,
    });

    // 썸네일 레코드 생성
    const thumbnail = await this.prisma.ytThumbnail.create({
      data: {
        projectId: dto.projectId ?? null,
        baseImageUrl: imageUrls[0] ?? null,
        prompt: dto.prompt,
        status: 'GENERATING',
      },
    });

    return {
      id: thumbnail.id,
      imageUrls,
      status: 'COMPLETED',
    };
  }

  /**
   * 썸네일 저장 (캔버스 편집 결과)
   */
  async saveThumbnail(dto: ThumbnailSaveDto) {
    return this.prisma.ytThumbnail.create({
      data: {
        projectId: dto.projectId ?? null,
        imageUrl: dto.imageUrl,
        baseImageUrl: dto.baseImageUrl ?? null,
        canvasData: dto.canvasData ? (dto.canvasData as Prisma.InputJsonValue) : undefined,
        strategy: dto.strategy ? (dto.strategy as Prisma.InputJsonValue) : undefined,
        prompt: dto.prompt ?? null,
        status: 'COMPLETED',
      },
    });
  }

  /**
   * 프로젝트별 썸네일 목록
   */
  async getThumbnails(projectId?: string) {
    return this.prisma.ytThumbnail.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * 썸네일 삭제
   */
  async deleteThumbnail(id: string) {
    return this.prisma.ytThumbnail.delete({ where: { id } });
  }

  /**
   * 레퍼런스 썸네일 분석 (Claude Vision)
   */
  async analyzeThumbnail(imageBase64: string, mediaType: string, dto: ThumbnailAnalyzeDto) {
    const analysis = await this.aiOrchestration.analyzeThumbnailImage(
      imageBase64,
      mediaType,
      dto.userNote,
    );

    // 메모리에 저장
    if (dto.saveToMemory) {
      try {
        const parsed = JSON.parse(analysis.match(/```json\s*([\s\S]*?)\s*```/)?.[1] ?? analysis);
        await this.prisma.ytSkillNote.create({
          data: {
            category: 'thumbnail',
            title: `[AI 분석] ${parsed.emotionalTone ?? '썸네일'} - ${parsed.layout ?? '분석'}`,
            content: `구도: ${parsed.layout}\n색상: ${JSON.stringify(parsed.colorScheme)}\n텍스트: ${JSON.stringify(parsed.textStrategy)}\n감정: ${parsed.emotionalTone}\n효과: ${parsed.effectivenessReason}`,
            source: 'thumbnail-analyzer',
            tags: ['ai-analysis', parsed.emotionalTone, parsed.layout].filter(Boolean),
          },
        });
      } catch {
        this.logger.warn('분석 결과 메모리 저장 실패 (JSON 파싱 오류)');
      }
    }

    return analysis;
  }

  /**
   * 전문가 직접 노하우 저장
   */
  async saveThumbnailMemory(dto: ThumbnailMemoryDto) {
    return this.prisma.ytSkillNote.create({
      data: {
        category: 'thumbnail',
        title: `[전문가] ${dto.content.slice(0, 50)}`,
        content: dto.content,
        source: 'expert-input',
        tags: ['expert-rule', ...dto.tags],
      },
    });
  }

  /**
   * 썸네일 피드백 저장
   */
  async saveThumbnailFeedback(dto: ThumbnailFeedbackDto) {
    const thumbnail = await this.prisma.ytThumbnail.findUnique({ where: { id: dto.thumbnailId } });
    if (!thumbnail) throw new NotFoundException('썸네일을 찾을 수 없습니다');

    return this.prisma.ytSkillNote.create({
      data: {
        category: 'thumbnail',
        title: `[피드백] ${dto.rating === 'good' ? '좋음' : '별로'} - ${dto.comment?.slice(0, 30) ?? '무제'}`,
        content: `평가: ${dto.rating}\n프롬프트: ${thumbnail.prompt ?? '없음'}\n코멘트: ${dto.comment ?? '없음'}`,
        source: 'feedback',
        tags: ['feedback', dto.rating],
      },
    });
  }

  /**
   * 학습된 썸네일 메모리 조회
   */
  async getThumbnailMemory() {
    return this.prisma.ytSkillNote.findMany({
      where: { category: 'thumbnail' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
