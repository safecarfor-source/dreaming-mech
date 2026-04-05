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
} from './schemas/youtube-supporter.schema';
import { YtProjectStatus } from '@prisma/client';

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
}
