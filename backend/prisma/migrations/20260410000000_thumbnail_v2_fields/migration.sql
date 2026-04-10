-- AlterTable: YtThumbnail V2 필드 추가
ALTER TABLE "YtThumbnail" ADD COLUMN "engine" TEXT;
ALTER TABLE "YtThumbnail" ADD COLUMN "hasFace" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "YtThumbnail" ADD COLUMN "parentId" TEXT;
ALTER TABLE "YtThumbnail" ADD COLUMN "variationOf" TEXT;
ALTER TABLE "YtThumbnail" ADD COLUMN "finalUrl" TEXT;

-- CreateIndex: parentId 인덱스
CREATE INDEX "YtThumbnail_parentId_idx" ON "YtThumbnail"("parentId");

-- CreateTable: YtFaceReference
CREATE TABLE "YtFaceReference" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YtFaceReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: YtFaceReference isActive 인덱스
CREATE INDEX "YtFaceReference_isActive_idx" ON "YtFaceReference"("isActive");
