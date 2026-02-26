import { z } from 'zod';

export const CreateTrackingLinkSchema = z.object({
  name: z.string().min(1, '링크 이름을 입력해주세요').max(100, '이름은 100자 이내여야 합니다'),
  description: z.string().max(500, '설명은 500자 이내여야 합니다').optional(),
  targetUrl: z.string().min(1).default('/'),
});

export type CreateTrackingLinkDto = z.infer<typeof CreateTrackingLinkSchema>;

export const UpdateTrackingLinkSchema = z.object({
  name: z.string().min(1, '링크 이름을 입력해주세요').max(100).optional(),
  description: z.string().max(500).optional(),
  targetUrl: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTrackingLinkDto = z.infer<typeof UpdateTrackingLinkSchema>;

export const RecordClickSchema = z.object({
  code: z.string().min(1, '추적 코드를 입력해주세요'),
});

export type RecordClickDto = z.infer<typeof RecordClickSchema>;
