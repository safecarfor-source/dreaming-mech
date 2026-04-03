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
} from './schemas/youtube-supporter.schema';
import { YtProjectStatus } from '@prisma/client';

@Injectable()
export class YouTubeSupporterService {
  private readonly logger = new Logger(YouTubeSupporterService.name);

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

    this.logger.log(`제작 시작: projectId=${projectId}, videos=${project.referenceVideos.length}개`);

    // 레퍼런스 영상 컨텍스트 구성
    const referenceContext = project.referenceVideos.map((v) => ({
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
        comments: rawComments.map((c) => ({ text: c.text, likeCount: c.likeCount })),
      };
    }

    // 버전 1, 2 동시 생성 (병렬 실행)
    const [v1Result, v2Result] = await Promise.all([
      this.aiOrchestration.runProductionPipeline(project.title, referenceContext, comments),
      this.aiOrchestration.runProductionPipeline(project.title, referenceContext, comments),
    ]);

    // DB 저장 (upsert — 재실행 시 덮어씀)
    const [v1Data, v2Data] = await Promise.all([
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

    return {
      success: true,
      data: {
        version1: v1Data,
        version2: v2Data,
      },
    };
  }

  async getProduction(projectId: string) {
    await this.ensureProjectExists(projectId);

    const productionData = await this.prisma.ytProductionData.findMany({
      where: { projectId },
      orderBy: { version: 'asc' },
    });

    return { success: true, data: productionData };
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
