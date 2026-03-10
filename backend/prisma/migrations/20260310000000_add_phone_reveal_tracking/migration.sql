-- CreateTable: PhoneRevealLog — 전화번호 공개 추적 로그
CREATE TABLE "PhoneRevealLog" (
    "id"          SERIAL       NOT NULL,
    "mechanicId"  INTEGER      NOT NULL,
    "ipAddress"   TEXT,
    "userAgent"   TEXT,
    "isBot"       BOOLEAN      NOT NULL DEFAULT false,
    "revealedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneRevealLog_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Mechanic — phoneRevealCount 컬럼 추가
ALTER TABLE "Mechanic" ADD COLUMN "phoneRevealCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PhoneRevealLog_mechanicId_revealedAt_idx" ON "PhoneRevealLog"("mechanicId", "revealedAt");
CREATE INDEX "PhoneRevealLog_ipAddress_idx" ON "PhoneRevealLog"("ipAddress");

-- AddForeignKey
ALTER TABLE "PhoneRevealLog" ADD CONSTRAINT "PhoneRevealLog_mechanicId_fkey"
    FOREIGN KEY ("mechanicId") REFERENCES "Mechanic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
