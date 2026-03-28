-- 보안: IncentiveUser 테이블에서 평문 비밀번호 컬럼 제거
ALTER TABLE "IncentiveUser" DROP COLUMN IF EXISTS "plainPassword";
