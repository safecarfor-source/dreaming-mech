import { z } from 'zod';

/**
 * 견적 요청 생성 스키마
 */
export const CreateQuoteRequestSchema = z.object({
  mechanicId: z.number().int().positive('정비소 ID가 필요합니다'),

  customerName: z
    .string()
    .min(1, '이름을 입력해주세요')
    .max(50, '이름은 50자 이내로 입력해주세요'),

  customerPhone: z
    .string()
    .regex(
      /^01[016789]-?\d{3,4}-?\d{4}$/,
      '올바른 휴대전화 번호를 입력해주세요 (예: 010-1234-5678)',
    ),

  carModel: z
    .string()
    .min(1, '차종을 입력해주세요')
    .max(100, '차종은 100자 이내로 입력해주세요'),

  carYear: z
    .string()
    .max(10, '연식은 10자 이내로 입력해주세요')
    .optional(),

  description: z
    .string()
    .min(10, '증상을 10자 이상 입력해주세요')
    .max(1000, '증상은 1000자 이내로 입력해주세요'),

  images: z
    .array(z.string().url('올바른 이미지 URL이 필요합니다'))
    .max(3, '사진은 최대 3장까지 첨부할 수 있습니다')
    .optional()
    .default([]),
});

/**
 * 견적 요청 상태 변경 스키마
 */
export const UpdateQuoteRequestStatusSchema = z.object({
  status: z.enum(['VIEWED', 'REPLIED', 'COMPLETED', 'CANCELLED'], {
    error: '올바른 상태값이 아닙니다',
  }),
});

export type CreateQuoteRequestDto = z.infer<typeof CreateQuoteRequestSchema>;
export type UpdateQuoteRequestStatusDto = z.infer<
  typeof UpdateQuoteRequestStatusSchema
>;
