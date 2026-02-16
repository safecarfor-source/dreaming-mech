import { z } from 'zod';

/**
 * 리뷰 생성 스키마
 */
export const CreateReviewSchema = z.object({
  mechanicId: z.number().int().positive('정비소 ID가 필요합니다'),

  nickname: z
    .string()
    .min(1, '닉네임을 입력해주세요')
    .max(20, '닉네임은 20자 이내로 입력해주세요'),

  content: z
    .string()
    .min(1, '리뷰를 입력해주세요')
    .max(100, '리뷰는 100자 이내로 입력해주세요'),

  rating: z
    .number()
    .int()
    .min(1, '별점은 1점 이상이어야 합니다')
    .max(5, '별점은 5점 이하여야 합니다')
    .default(5),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
