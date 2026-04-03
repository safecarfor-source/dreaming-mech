import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { YouTubeSupporterService } from './youtube-supporter.service';
import { YtAuthGuard } from './guards/yt-auth.guard';
import { YtExternalApiGuard } from './guards/yt-external-api.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  AuthSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  SearchVideoSchema,
  TranscriptSchema,
  ProduceSchema,
  TimelineSchema,
  CreateSkillNoteSchema,
  LearnSchema,
  ExternalSaveSchema,
  type AuthDto,
  type CreateProjectDto,
  type UpdateProjectDto,
  type SearchVideoDto,
  type TranscriptDto,
  type ProduceDto,
  type TimelineDto,
  type CreateSkillNoteDto,
  type LearnDto,
  type ExternalSaveDto,
} from './schemas/youtube-supporter.schema';

/**
 * YouTube Supporter 컨트롤러
 * 기본 경로: /api/yt
 */
@Controller('yt')
export class YouTubeSupporterController {
  constructor(private readonly service: YouTubeSupporterService) {}

  // ─────────────────────────────────────────────
  // 인증
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/auth
   * 비밀번호 검증 → yt_token 쿠키 발급
   */
  @Post('auth')
  @HttpCode(HttpStatus.OK)
  auth(
    @Body(new ZodValidationPipe(AuthSchema)) dto: AuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const expectedPassword = process.env.YT_PASSWORD;

    if (expectedPassword && dto.password !== expectedPassword) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다');
    }

    // 개발 환경: YT_PASSWORD 미설정 시 모든 비밀번호 허용
    if (!expectedPassword && process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('서버 설정 오류');
    }

    // HttpOnly 쿠키 발급 (7일)
    res.cookie('yt_token', dto.password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/yt',
    });

    return { success: true, message: '인증 성공', token: dto.password };
  }

  // ─────────────────────────────────────────────
  // 프로젝트 CRUD
  // ─────────────────────────────────────────────

  /**
   * GET /api/yt/projects?status=IN_PROGRESS|COMPLETED
   */
  @Get('projects')
  @UseGuards(YtAuthGuard)
  getProjects(@Query('status') status?: string) {
    return this.service.getProjects(status);
  }

  /**
   * POST /api/yt/projects
   */
  @Post('projects')
  @UseGuards(YtAuthGuard)
  createProject(
    @Body(new ZodValidationPipe(CreateProjectSchema)) dto: CreateProjectDto,
  ) {
    return this.service.createProject(dto);
  }

  /**
   * GET /api/yt/projects/:id
   */
  @Get('projects/:id')
  @UseGuards(YtAuthGuard)
  getProject(@Param('id') id: string) {
    return this.service.getProject(id);
  }

  /**
   * PATCH /api/yt/projects/:id
   */
  @Patch('projects/:id')
  @UseGuards(YtAuthGuard)
  updateProject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProjectSchema)) dto: UpdateProjectDto,
  ) {
    return this.service.updateProject(id, dto);
  }

  /**
   * PATCH /api/yt/projects/:id/complete
   */
  @Patch('projects/:id/complete')
  @UseGuards(YtAuthGuard)
  completeProject(@Param('id') id: string) {
    return this.service.completeProject(id);
  }

  // ─────────────────────────────────────────────
  // YouTube 검색
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/search
   * body: { keyword, language?, maxResults? }
   */
  @Post('search')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  searchVideos(
    @Body(new ZodValidationPipe(SearchVideoSchema)) dto: SearchVideoDto,
  ) {
    return this.service.searchVideos(dto);
  }

  /**
   * GET /api/yt/video/:videoId/stats
   * 조회수, 구독자, 비율 조회
   */
  @Get('video/:videoId/stats')
  @UseGuards(YtAuthGuard)
  getVideoStats(@Param('videoId') videoId: string) {
    return this.service.getVideoStats(videoId);
  }

  /**
   * POST /api/yt/video/transcript
   * body: { videoId, language? }
   */
  @Post('video/transcript')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  extractTranscript(
    @Body(new ZodValidationPipe(TranscriptSchema)) dto: TranscriptDto,
  ) {
    return this.service.extractTranscript(dto);
  }

  // ─────────────────────────────────────────────
  // 제작 (STEP 2~5)
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/projects/:id/produce
   * AI 분석 + 제작 (버전 1, 2 동시 생성)
   * body: { referenceVideoIds: string[] }
   */
  @Post('projects/:id/produce')
  @UseGuards(YtAuthGuard)
  produce(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ProduceSchema)) dto: ProduceDto,
  ) {
    return this.service.produce(id, dto);
  }

  /**
   * GET /api/yt/projects/:id/production
   * 제작 데이터 조회
   */
  @Get('projects/:id/production')
  @UseGuards(YtAuthGuard)
  getProduction(@Param('id') id: string) {
    return this.service.getProduction(id);
  }

  // ─────────────────────────────────────────────
  // 타임라인
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/projects/:id/timeline
   * body: { scriptContent, version? }
   */
  @Post('projects/:id/timeline')
  @UseGuards(YtAuthGuard)
  generateTimeline(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(TimelineSchema)) dto: TimelineDto,
  ) {
    return this.service.generateTimeline(id, dto);
  }

  // ─────────────────────────────────────────────
  // 스킬 노트
  // ─────────────────────────────────────────────

  /**
   * GET /api/yt/skills?category=script|thumbnail|intro|shortform|other
   */
  @Get('skills')
  @UseGuards(YtAuthGuard)
  getSkillNotes(@Query('category') category?: string) {
    return this.service.getSkillNotes(category);
  }

  /**
   * POST /api/yt/skills
   */
  @Post('skills')
  @UseGuards(YtAuthGuard)
  createSkillNote(
    @Body(new ZodValidationPipe(CreateSkillNoteSchema)) dto: CreateSkillNoteDto,
  ) {
    return this.service.createSkillNote(dto);
  }

  // ─────────────────────────────────────────────
  // 학습 요청
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/learn
   * body: { type: 'url'|'text'|'file', content, title?, category? }
   */
  @Post('learn')
  @UseGuards(YtAuthGuard)
  processLearnRequest(
    @Body(new ZodValidationPipe(LearnSchema)) dto: LearnDto,
  ) {
    return this.service.processLearnRequest(dto);
  }

  // ─────────────────────────────────────────────
  // 외부 연동 (클로드 앱 → DB 저장)
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/external/save
   * x-api-key 헤더로 인증 (YT_EXTERNAL_API_KEY 환경변수)
   */
  @Post('external/save')
  @UseGuards(YtExternalApiGuard)
  @HttpCode(HttpStatus.CREATED)
  externalSave(
    @Body(new ZodValidationPipe(ExternalSaveSchema)) dto: ExternalSaveDto,
  ) {
    // 별도 API 키 인증 (YtAuthGuard 대신)
    return this.service.externalSave(dto);
  }
}
