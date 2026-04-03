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
  shootingDate: z.string().datetime().optional().nullable(),
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
