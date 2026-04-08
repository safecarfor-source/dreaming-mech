import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Req,
  StreamableFile,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { YouTubeSupporterService } from './youtube-supporter.service';
import { BackgroundRemovalService } from './services/background-removal.service';
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
  CreateChannelSchema,
  UpdateChannelSchema,
  CreateCategorySchema,
  DiscoverChannelVideosSchema,
  DiscoverKeywordSchema,
  DiscoverFindChannelsSchema,
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
  type CreateChannelDto,
  type UpdateChannelDto,
  type CreateCategoryDto,
  type DiscoverChannelVideosDto,
  type DiscoverKeywordDto,
  type DiscoverFindChannelsDto,
  ThumbnailStrategySchema,
  ThumbnailGenerateSchema,
  ThumbnailAnalyzeSchema,
  ThumbnailSaveSchema,
  ThumbnailFeedbackSchema,
  ThumbnailMemorySchema,
  UploadToS3Schema,
  type ThumbnailStrategyDto,
  type ThumbnailGenerateDto,
  type ThumbnailAnalyzeDto,
  type ThumbnailSaveDto,
  type ThumbnailFeedbackDto,
  type ThumbnailMemoryDto,
  type UploadToS3Dto,
} from './schemas/youtube-supporter.schema';

/**
 * YouTube Supporter 컨트롤러
 * 기본 경로: /api/yt
 */
@Controller('yt')
export class YouTubeSupporterController {
  constructor(
    private readonly service: YouTubeSupporterService,
    private readonly backgroundRemoval: BackgroundRemovalService,
  ) {}

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
   * DELETE /api/yt/projects/:id
   */
  @Delete('projects/:id')
  @UseGuards(YtAuthGuard)
  deleteProject(@Param('id') id: string) {
    return this.service.deleteProject(id);
  }

  /**
   * PATCH /api/yt/projects/:id/complete
   */
  @Patch('projects/:id/complete')
  @UseGuards(YtAuthGuard)
  completeProject(@Param('id') id: string) {
    return this.service.completeProject(id);
  }

  /**
   * PATCH /api/yt/projects/:id/reopen — 완료 취소 (진행 중으로 되돌리기)
   */
  @Patch('projects/:id/reopen')
  @UseGuards(YtAuthGuard)
  reopenProject(@Param('id') id: string) {
    return this.service.reopenProject(id);
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
  // 숏폼 분석
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/shortform/analyze
   * body: { videoUrl?, projectId?, transcript? }
   */
  @Post('shortform/analyze')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  analyzeShortform(
    @Body() dto: { videoUrl?: string; projectId?: string; transcript?: string },
  ) {
    return this.service.analyzeShortform(dto);
  }

  // ─────────────────────────────────────────────
  // 대본 대화형 수정 + 직접 편집
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/projects/:id/refine
   * body: { message, version?, chatHistory? }
   */
  @Post('projects/:id/refine')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  refineScript(
    @Param('id') id: string,
    @Body() dto: { message: string; version?: number; chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }> },
  ) {
    return this.service.refineScript(id, dto);
  }

  /**
   * PATCH /api/yt/projects/:id/production/:version
   * 대본/제목 등 직접 수정
   */
  @Patch('projects/:id/production/:version')
  @UseGuards(YtAuthGuard)
  updateProductionData(
    @Param('id') id: string,
    @Param('version') version: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.service.updateProductionData(id, parseInt(version, 10), dto);
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

  // ─────────────────────────────────────────────
  // 채널 관리 (주제 찾기)
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/channels
   * body: { channelUrl, category?, memo? }
   */
  @Post('channels')
  @UseGuards(YtAuthGuard)
  createChannel(
    @Body(new ZodValidationPipe(CreateChannelSchema)) dto: CreateChannelDto,
  ) {
    return this.service.createChannel(dto);
  }

  /**
   * GET /api/yt/channels?category=카테고리명
   */
  @Get('channels')
  @UseGuards(YtAuthGuard)
  getChannels(@Query('category') category?: string) {
    return this.service.getChannels(category);
  }

  /**
   * PATCH /api/yt/channels/:id
   * body: { category?, memo? }
   */
  @Patch('channels/:id')
  @UseGuards(YtAuthGuard)
  updateChannel(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateChannelSchema)) dto: UpdateChannelDto,
  ) {
    return this.service.updateChannel(id, dto);
  }

  /**
   * DELETE /api/yt/channels/:id
   */
  @Delete('channels/:id')
  @UseGuards(YtAuthGuard)
  deleteChannel(@Param('id') id: string) {
    return this.service.deleteChannel(id);
  }

  // ─────────────────────────────────────────────
  // 카테고리 관리
  // ─────────────────────────────────────────────

  /**
   * GET /api/yt/categories
   */
  @Get('categories')
  @UseGuards(YtAuthGuard)
  getCategories() {
    return this.service.getCategories();
  }

  /**
   * POST /api/yt/categories
   * body: { name }
   */
  @Post('categories')
  @UseGuards(YtAuthGuard)
  createCategory(
    @Body(new ZodValidationPipe(CreateCategorySchema)) dto: CreateCategoryDto,
  ) {
    return this.service.createCategory(dto.name);
  }

  /**
   * DELETE /api/yt/categories/:id
   */
  @Delete('categories/:id')
  @UseGuards(YtAuthGuard)
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  // ─────────────────────────────────────────────
  // 주제 찾기 (Discover)
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/discover/channel-videos
   * body: { category?, limit? }
   * 등록된 채널 영상 중 평균 조회수 초과 + viewSubRatio 높은 영상 발굴
   */
  @Post('discover/channel-videos')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  discoverChannelVideos(
    @Body(new ZodValidationPipe(DiscoverChannelVideosSchema)) dto: DiscoverChannelVideosDto,
  ) {
    return this.service.discoverChannelVideos(dto);
  }

  /**
   * POST /api/yt/discover/keyword
   * body: { keyword, language?, maxResults? }
   * 키워드로 영상 검색 + viewSubRatio 계산
   */
  @Post('discover/keyword')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  discoverByKeyword(
    @Body(new ZodValidationPipe(DiscoverKeywordSchema)) dto: DiscoverKeywordDto,
  ) {
    return this.service.discoverByKeyword(dto);
  }

  /**
   * GET /api/yt/discover/trending?maxResults=50
   * 인기 급상승 영상 조회
   */
  @Get('discover/trending')
  @UseGuards(YtAuthGuard)
  discoverTrending(@Query('maxResults') maxResults?: string) {
    return this.service.discoverTrending(maxResults ? parseInt(maxResults, 10) : undefined);
  }

  /**
   * POST /api/yt/discover/recommend
   * AI가 등록 채널 + 트렌드 분석 후 영상 주제 추천
   */
  @Post('discover/recommend')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  discoverRecommend() {
    return this.service.discoverRecommend();
  }

  /**
   * POST /api/yt/discover/find-channels
   * body: { keyword }
   * 키워드로 채널 검색 (벤치마크 채널 발굴용)
   */
  @Post('discover/find-channels')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  discoverFindChannels(
    @Body(new ZodValidationPipe(DiscoverFindChannelsSchema)) dto: DiscoverFindChannelsDto,
  ) {
    return this.service.discoverFindChannels(dto);
  }

  // ─────────────────────────────────────────────
  // 레퍼런스 자동 추천
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/projects/:id/suggest-references
   * 프로젝트 주제 기반으로 YouTube 전체에서 viewSubRatio 상위 5개 영상 자동 추천
   */
  @Post('projects/:id/suggest-references')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  suggestReferences(@Param('id') id: string) {
    return this.service.suggestReferences(id);
  }

  /**
   * POST /api/yt/projects/:id/references
   * 발굴된 영상을 레퍼런스로 프로젝트에 저장
   * body: { videos: [{ videoId, title, channelName, channelId?, viewCount?, subscriberCount?, thumbnailUrl? }] }
   */
  @Post('projects/:id/references')
  @UseGuards(YtAuthGuard)
  addReferences(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.service.addReferences(id, dto);
  }

  // ─────────────────────────────────────────────
  // 숏폼 Phase 2: 영상 처리 (Python 서비스 프록시)
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/shortform/process
   * 영상 파일 업로드 → Python 숏폼 파이프라인 시작 → jobId 반환
   */
  @Post('shortform/process')
  @UseGuards(YtAuthGuard)
  @UseInterceptors(FileInterceptor('video', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = '/tmp/shortform-uploads';
        mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  }))
  @HttpCode(HttpStatus.OK)
  async shortformProcess(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const token = req.headers['x-yt-token'] as string | undefined;
    return this.service.shortformProcess(file, token);
  }

  /**
   * GET /api/yt/shortform/job/:jobId
   * 숏폼 잡 처리 상태 조회
   */
  @Get('shortform/job/:jobId')
  @UseGuards(YtAuthGuard)
  async shortformJobStatus(
    @Param('jobId') jobId: string,
    @Req() req: Request,
  ) {
    const token = req.headers['x-yt-token'] as string | undefined;
    return this.service.shortformJobStatus(jobId, token);
  }

  /**
   * GET /api/yt/shortform/download/:jobId/:index
   * 완성된 숏폼 클립 다운로드
   */
  @Get('shortform/download/:jobId/:index')
  async shortformDownload(
    @Param('jobId') jobId: string,
    @Param('index') index: string,
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    return this.service.shortformDownload(jobId, index, token, res);
  }

  /**
   * POST /api/yt/shortform/save
   * 숏폼 작업 결과 DB 저장
   */
  @Post('shortform/save')
  @UseGuards(YtAuthGuard)
  async shortformSave(
    @Body() body: { projectId: string; externalJobId: string; status: string; fileName?: string; results?: any; error?: string },
  ) {
    return this.service.shortformSave(body);
  }

  /**
   * GET /api/yt/shortform/list/:projectId
   * 프로젝트의 숏폼 작업 이력 조회
   */
  @Get('shortform/list/:projectId')
  @UseGuards(YtAuthGuard)
  async shortformList(
    @Param('projectId') projectId: string,
  ) {
    return this.service.shortformList(projectId);
  }

  /**
   * GET /api/yt/shortform/storage
   * 숏폼 output 파일 리스트 (용량 관리)
   */
  @Get('shortform/storage')
  @UseGuards(YtAuthGuard)
  async shortformStorage() {
    return this.service.shortformStorage();
  }

  /**
   * DELETE /api/yt/shortform/storage/:jobId
   * 특정 job 폴더 삭제
   */
  @Delete('shortform/storage/:jobId')
  @UseGuards(YtAuthGuard)
  async shortformStorageDelete(
    @Param('jobId') jobId: string,
  ) {
    return this.service.shortformStorageDelete(jobId);
  }

  /**
   * DELETE /api/yt/shortform/saved/:id
   * DB 저장된 숏폼 이력 삭제
   */
  @Delete('shortform/saved/:id')
  @UseGuards(YtAuthGuard)
  async shortformJobDelete(
    @Param('id') id: string,
  ) {
    return this.service.shortformJobDelete(id);
  }

  // ─────────────────────────────────────────────
  // 썸네일 AI
  // ─────────────────────────────────────────────

  /**
   * POST /api/yt/thumbnail/strategy
   * AI 썸네일 전략 생성 (3안)
   */
  @Post('thumbnail/strategy')
  @UseGuards(YtAuthGuard)
  async thumbnailStrategy(
    @Body(new ZodValidationPipe(ThumbnailStrategySchema)) dto: ThumbnailStrategyDto,
  ) {
    return this.service.generateThumbnailStrategy(dto);
  }

  /**
   * POST /api/yt/thumbnail/generate
   * FLUX로 썸네일 배경 이미지 생성
   */
  @Post('thumbnail/generate')
  @UseGuards(YtAuthGuard)
  async thumbnailGenerate(
    @Body(new ZodValidationPipe(ThumbnailGenerateSchema)) dto: ThumbnailGenerateDto,
  ) {
    return this.service.generateThumbnailImage(dto);
  }

  /**
   * POST /api/yt/thumbnail/analyze
   * 레퍼런스 썸네일 분석 (Claude Vision)
   */
  @Post('thumbnail/analyze')
  @UseGuards(YtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async thumbnailAnalyze(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(ThumbnailAnalyzeSchema)) dto: ThumbnailAnalyzeDto,
  ) {
    if (!file) {
      throw new BadRequestException('이미지 파일을 업로드해주세요');
    }
    const imageBase64 = file.buffer.toString('base64');
    return this.service.analyzeThumbnail(imageBase64, file.mimetype, dto);
  }

  /**
   * POST /api/yt/thumbnail/save
   * 완성 썸네일 저장
   */
  @Post('thumbnail/save')
  @UseGuards(YtAuthGuard)
  async thumbnailSave(
    @Body(new ZodValidationPipe(ThumbnailSaveSchema)) dto: ThumbnailSaveDto,
  ) {
    return this.service.saveThumbnail(dto);
  }

  /**
   * GET /api/yt/thumbnail/list
   * 썸네일 목록 조회
   */
  @Get('thumbnail/list')
  @UseGuards(YtAuthGuard)
  async thumbnailList(
    @Query('projectId') projectId?: string,
  ) {
    return this.service.getThumbnails(projectId);
  }

  /**
   * DELETE /api/yt/thumbnail/:id
   * 썸네일 삭제
   */
  @Delete('thumbnail/:id')
  @UseGuards(YtAuthGuard)
  async thumbnailDelete(
    @Param('id') id: string,
  ) {
    return this.service.deleteThumbnail(id);
  }

  /**
   * POST /api/yt/thumbnail/feedback
   * 썸네일 피드백 (좋아요/별로)
   */
  @Post('thumbnail/feedback')
  @UseGuards(YtAuthGuard)
  async thumbnailFeedback(
    @Body(new ZodValidationPipe(ThumbnailFeedbackSchema)) dto: ThumbnailFeedbackDto,
  ) {
    return this.service.saveThumbnailFeedback(dto);
  }

  /**
   * POST /api/yt/thumbnail/memory
   * 전문가 노하우 직접 입력
   */
  @Post('thumbnail/memory')
  @UseGuards(YtAuthGuard)
  async thumbnailMemory(
    @Body(new ZodValidationPipe(ThumbnailMemorySchema)) dto: ThumbnailMemoryDto,
  ) {
    return this.service.saveThumbnailMemory(dto);
  }

  /**
   * GET /api/yt/thumbnail/memory
   * 학습된 썸네일 메모리 조회
   */
  @Get('thumbnail/memory')
  @UseGuards(YtAuthGuard)
  async thumbnailMemoryList() {
    return this.service.getThumbnailMemory();
  }

  /**
   * POST /api/yt/thumbnail/analyze-batch
   * 배치 썸네일 분석 (최대 10장)
   */
  @Post('thumbnail/analyze-batch')
  @UseGuards(YtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  async thumbnailAnalyzeBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { userNote?: string },
  ) {
    if (!files?.length) {
      throw new BadRequestException('최소 1장의 이미지를 업로드해주세요');
    }
    return this.service.analyzeThumbnailBatch(files, body.userNote);
  }

  /**
   * POST /api/yt/thumbnail/extract-insights
   * 학습 데이터에서 자동 인사이트 추출
   */
  @Post('thumbnail/extract-insights')
  @UseGuards(YtAuthGuard)
  async thumbnailExtractInsights(
    @Body() body: { noteIds?: string[] },
  ) {
    return this.service.extractInsights(body.noteIds);
  }

  /**
   * GET /api/yt/thumbnail/memory/stats
   * 학습 메모리 통계
   */
  @Get('thumbnail/memory/stats')
  @UseGuards(YtAuthGuard)
  async thumbnailMemoryStats() {
    return this.service.getThumbnailMemoryStats();
  }

  /**
   * PATCH /api/yt/thumbnail/memory/:id
   * 학습 메모리 수정
   */
  @Patch('thumbnail/memory/:id')
  @UseGuards(YtAuthGuard)
  async thumbnailMemoryUpdate(
    @Param('id') id: string,
    @Body() body: { content?: string; tags?: string[]; score?: number },
  ) {
    return this.service.updateThumbnailMemory(id, body);
  }

  /**
   * DELETE /api/yt/thumbnail/memory/:id
   * 학습 메모리 삭제
   */
  @Delete('thumbnail/memory/:id')
  @UseGuards(YtAuthGuard)
  async thumbnailMemoryDelete(
    @Param('id') id: string,
  ) {
    return this.service.deleteThumbnailMemory(id);
  }

  /**
   * POST /api/yt/thumbnail/remove-bg
   * 배경 제거 후 S3 업로드
   */
  @Post('thumbnail/remove-bg')
  @UseGuards(YtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  async thumbnailRemoveBg(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('이미지 파일을 업로드해주세요');
    }
    return this.service.removeBgAndUpload(file.buffer, this.backgroundRemoval);
  }

  /**
   * POST /api/yt/thumbnail/upload-to-s3
   * base64 이미지 S3 업로드
   */
  @Post('thumbnail/upload-to-s3')
  @UseGuards(YtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async thumbnailUploadToS3(
    @Body(new ZodValidationPipe(UploadToS3Schema)) dto: UploadToS3Dto,
  ) {
    return this.service.uploadBase64ToS3(dto.imageBase64);
  }
}
