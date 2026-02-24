import { z } from 'zod';

export const CreateServiceInquirySchema = z.object({
  name: z.string().optional(),
  regionSido: z.string().min(1, '시/도를 입력해주세요'),
  regionSigungu: z.string().min(1, '시/군/구를 입력해주세요'),
  serviceType: z.enum(['TIRE', 'OIL', 'BRAKE', 'MAINTENANCE', 'CONSULT']),
  description: z.string().optional(),
  phone: z.string().min(10, '올바른 전화번호를 입력해주세요').max(13),
});

export type CreateServiceInquiryDto = z.infer<typeof CreateServiceInquirySchema>;
