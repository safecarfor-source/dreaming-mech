import { z } from 'zod';

export const CreateServiceInquirySchema = z.object({
  name: z.string().optional(),
  regionSido: z.string().min(1, '시/도를 입력해주세요'),
  regionSigungu: z.string().min(1, '시/군/구를 입력해주세요'),
  regionDong: z.string().optional(), // 동/읍/면 (예: "영통동", 선택사항)
  serviceType: z.enum(['TIRE', 'OIL', 'BRAKE', 'MAINTENANCE', 'CONSULT']),
  description: z.string().optional(),
  phone: z.string().min(10, '올바른 전화번호를 입력해주세요').max(13),
  vehicleNumber: z.string().optional(), // 차량번호 (예: 12가3456)
  vehicleModel: z.string().optional(),  // 차종 (예: 현대 아반떼)
  trackingCode: z.string().optional(), // 추적 링크 코드 (유입 경로 추적)
  mechanicId: z.number().int().positive().optional(), // 선택된 정비소 ID
});

export type CreateServiceInquiryDto = z.infer<typeof CreateServiceInquirySchema>;
