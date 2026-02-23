import { z } from 'zod';

export const CreateTireInquirySchema = z.object({
  region: z.string().min(1, '지역을 선택해주세요').max(50),
  subRegion: z.string().max(50).optional(),
  tireSize: z.string().min(1, '타이어 사이즈를 입력해주세요').max(20)
    .regex(/^\d{3}\/\d{2}R\d{2}$/, '올바른 타이어 사이즈 형식이 아닙니다 (예: 225/45R17)'),
  serviceType: z.enum(['REPLACEMENT', 'REPAIR', 'ALIGNMENT', 'INSPECTION']).default('REPLACEMENT'),
  carModel: z.string().max(100).optional(),
  images: z.array(z.string().url()).max(5).optional().default([]),
  description: z.string().max(500).optional(),
});

export type CreateTireInquiryDto = z.infer<typeof CreateTireInquirySchema>;

export const UpdateTireInquiryStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'MATCHED', 'COMPLETED', 'CANCELLED']),
  adminNote: z.string().max(500).optional(),
});

export type UpdateTireInquiryStatusDto = z.infer<typeof UpdateTireInquiryStatusSchema>;
