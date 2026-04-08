import { z } from 'zod';

// ─────────────────────────────────────────────
// 인증
// ─────────────────────────────────────────────

export const AuthSchema = z.object({
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export type AuthDto = z.infer<typeof AuthSchema>;

// ─────────────────────────────────────────────
// 프로젝트
// ─────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  title: z.string().min(1, '주제명을 입력하세요').max(200),
  shootingDate: z.string().optional().nullable().transform((val) => {
    if (!val) return null;
    // "2026-04-10" 같은 date-only → ISO datetime으로 변환
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return `${val}T00:00:00.000Z`;
    return val;
  }),
  sortOrder: z.number().int().optional().default(0),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;

// ─────────────────────────────────────────────
// YouTube 검색
// ─────────────────────────────────────────────

export const SearchVideoSchema = z.object({
  keyword: z.string().min(1, '검색어를 입력하세요').max(200),
  language: z.enum(['ko', 'en']).optional().default('ko'),
  maxResults: z.number().int().min(1).max(50).optional().default(10),
});

export const TranscriptSchema = z.object({
  videoId: z.string().min(1, '영상 ID를 입력하세요').max(20),
  language: z.enum(['ko', 'en']).optional().default('ko'),
});

export type SearchVideoDto = z.infer<typeof SearchVideoSchema>;
export type TranscriptDto = z.infer<typeof TranscriptSchema>;

// ─────────────────────────────────────────────
// 제작
// ─────────────────────────────────────────────

export const ProduceSchema = z.object({
  referenceVideoIds: z
    .array(z.string().uuid())
    .min(1, '최소 1개 이상의 레퍼런스 영상이 필요합니다')
    .max(10),
});

export type ProduceDto = z.infer<typeof ProduceSchema>;

// ─────────────────────────────────────────────
// 타임라인
// ─────────────────────────────────────────────

export const TimelineSchema = z.object({
  scriptContent: z.string().min(1, '대본 내용을 입력하세요').max(50000),
  version: z.number().int().min(1).max(2).optional().default(1),
});

export type TimelineDto = z.infer<typeof TimelineSchema>;

// ─────────────────────────────────────────────
// 스킬 노트
// ─────────────────────────────────────────────

export const CreateSkillNoteSchema = z.object({
  category: z.enum(['script', 'thumbnail', 'intro', 'shortform', 'other']),
  title: z.string().min(1, '제목을 입력하세요').max(200),
  content: z.string().min(1, '내용을 입력하세요').max(50000),
  source: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

export const UpdateSkillNoteSchema = CreateSkillNoteSchema.partial();

export type CreateSkillNoteDto = z.infer<typeof CreateSkillNoteSchema>;
export type UpdateSkillNoteDto = z.infer<typeof UpdateSkillNoteSchema>;

// ─────────────────────────────────────────────
// 학습 요청
// ─────────────────────────────────────────────

export const LearnSchema = z.object({
  type: z.enum(['url', 'text', 'file']),
  content: z.string().min(1, '내용을 입력하세요').max(100000),
  title: z.string().max(200).optional(),
  category: z.enum(['script', 'thumbnail', 'intro', 'shortform', 'other']).optional().default('other'),
});

export type LearnDto = z.infer<typeof LearnSchema>;

// ─────────────────────────────────────────────
// 외부 연동 (클로드 앱 → DB 저장)
// ─────────────────────────────────────────────

export const ExternalSaveSchema = z.object({
  category: z.enum(['script', 'thumbnail', 'intro', 'shortform', 'other']).optional().default('other'),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(100000),
  source: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

export type ExternalSaveDto = z.infer<typeof ExternalSaveSchema>;

// ─────────────────────────────────────────────
// 채널 관리 (주제 찾기)
// ─────────────────────────────────────────────

export const CreateChannelSchema = z.object({
  channelUrl: z.string().url('유효한 YouTube 채널 URL을 입력하세요'),
  category: z.string().max(50).optional(),
  memo: z.string().max(500).optional(),
});

export const UpdateChannelSchema = z.object({
  category: z.string().max(50).optional(),
  memo: z.string().max(500).optional(),
});

export type CreateChannelDto = z.infer<typeof CreateChannelSchema>;
export type UpdateChannelDto = z.infer<typeof UpdateChannelSchema>;

// ─────────────────────────────────────────────
// 카테고리 관리
// ─────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z.string().min(1, '카테고리명을 입력하세요').max(20, '카테고리명은 20자 이하로 입력하세요'),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

// ─────────────────────────────────────────────
// 주제 찾기 (Discover)
// ─────────────────────────────────────────────

export const DiscoverChannelVideosSchema = z.object({
  category: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  videoDuration: z.enum(['short', 'medium', 'long']).optional(),
});

export const DiscoverKeywordSchema = z.object({
  keyword: z.string().min(1, '검색어를 입력하세요'),
  language: z.string().optional(),
  maxResults: z.number().min(1).max(50).optional().default(50),
  videoDuration: z.enum(['short', 'medium', 'long']).optional(),
});

export const DiscoverFindChannelsSchema = z.object({
  keyword: z.string().min(1, '검색어를 입력하세요'),
});

export type DiscoverChannelVideosDto = z.infer<typeof DiscoverChannelVideosSchema>;
export type DiscoverKeywordDto = z.infer<typeof DiscoverKeywordSchema>;
export type DiscoverFindChannelsDto = z.infer<typeof DiscoverFindChannelsSchema>;

// ─────────────────────────────────────────────
// 썸네일 AI
// ─────────────────────────────────────────────

export const ThumbnailStrategySchema = z.object({
  projectId: z.string().uuid().optional(),
  customInstruction: z.string().max(500).optional(),
});

export const ThumbnailGenerateSchema = z.object({
  projectId: z.string().uuid().optional(),
  prompt: z.string().min(1, '프롬프트를 입력하세요').max(2000),
  width: z.number().int().min(256).max(2048).optional().default(1280),
  height: z.number().int().min(256).max(2048).optional().default(720),
});

export const ThumbnailAnalyzeSchema = z.object({
  userNote: z.string().max(1000).optional(),
  saveToMemory: z.boolean().optional().default(true),
});

export const ThumbnailSaveSchema = z.object({
  projectId: z.string().uuid().optional(),
  imageUrl: z.string().url(),
  baseImageUrl: z.string().url().optional(),
  canvasData: z.record(z.string(), z.any()).optional(),
  strategy: z.record(z.string(), z.any()).optional(),
  prompt: z.string().max(2000).optional(),
});

export const ThumbnailFeedbackSchema = z.object({
  thumbnailId: z.string().uuid(),
  rating: z.enum(['good', 'bad']),
  comment: z.string().max(500).optional(),
});

export const ThumbnailMemorySchema = z.object({
  content: z.string().min(1, '노하우 내용을 입력하세요').max(2000),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
});

export type ThumbnailStrategyDto = z.infer<typeof ThumbnailStrategySchema>;
export type ThumbnailGenerateDto = z.infer<typeof ThumbnailGenerateSchema>;
export type ThumbnailAnalyzeDto = z.infer<typeof ThumbnailAnalyzeSchema>;
export type ThumbnailSaveDto = z.infer<typeof ThumbnailSaveSchema>;
export type ThumbnailFeedbackDto = z.infer<typeof ThumbnailFeedbackSchema>;
export type ThumbnailMemoryDto = z.infer<typeof ThumbnailMemorySchema>;

// ─────────────────────────────────────────────
// 썸네일 S3 업로드
// ─────────────────────────────────────────────

export const UploadToS3Schema = z.object({
  imageBase64: z.string().min(1, 'base64 이미지를 입력하세요'),
});

export type UploadToS3Dto = z.infer<typeof UploadToS3Schema>;
