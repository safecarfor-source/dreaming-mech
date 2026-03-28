-- GdSyncLog 인덱스 추가 (조회 성능 개선)
CREATE INDEX IF NOT EXISTS "GdSyncLog_status_completedAt_idx" ON "GdSyncLog"("status", "completedAt");
CREATE INDEX IF NOT EXISTS "GdSyncLog_sourceHash_idx" ON "GdSyncLog"("sourceHash");

-- GdSaleDetail.saleDate nullable로 변경 (1970-01-01 오염 데이터 방지)
ALTER TABLE "GdSaleDetail" ALTER COLUMN "saleDate" DROP NOT NULL;

-- 기존 1970-01-01 오염 데이터 null로 정리
UPDATE "GdSaleDetail" SET "saleDate" = NULL WHERE "saleDate" = '1970-01-01';
