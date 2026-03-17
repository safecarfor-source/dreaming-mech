import { SetMetadata } from '@nestjs/common';

// ErpAuthGuard 우회용 데코레이터 — /erp/auth/* 엔드포인트에 사용
export const IS_PUBLIC_KEY = 'erp_is_public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
