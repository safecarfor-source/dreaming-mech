-- GdRepair: vehicleCode를 optional로 변경 + customerCode 추가
-- DATAS(매출전표) 데이터 소스 전환을 위해 FK 제약 완화

-- 1. FK 제약 제거
ALTER TABLE "GdRepair" DROP CONSTRAINT IF EXISTS "GdRepair_vehicleCode_fkey";

-- 2. vehicleCode nullable로 변경
ALTER TABLE "GdRepair" ALTER COLUMN "vehicleCode" DROP NOT NULL;

-- 3. customerCode 컬럼 추가
ALTER TABLE "GdRepair" ADD COLUMN IF NOT EXISTS "customerCode" TEXT;

-- 4. FK 재생성 (nullable 허용)
ALTER TABLE "GdRepair" ADD CONSTRAINT "GdRepair_vehicleCode_fkey"
  FOREIGN KEY ("vehicleCode") REFERENCES "GdVehicle"("code")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. customerCode 인덱스
CREATE INDEX IF NOT EXISTS "GdRepair_customerCode_idx" ON "GdRepair"("customerCode");
