-- AlterTable: Mechanic 모델에 isPremium 필드 추가
ALTER TABLE "Mechanic" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: isPremium 인덱스 추가
CREATE INDEX "Mechanic_isPremium_idx" ON "Mechanic"("isPremium");
