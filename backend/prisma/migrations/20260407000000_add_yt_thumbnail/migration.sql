-- CreateTable
CREATE TABLE "YtThumbnail" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "imageUrl" TEXT,
    "baseImageUrl" TEXT,
    "canvasData" JSONB,
    "strategy" JSONB,
    "prompt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YtThumbnail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YtThumbnail_projectId_idx" ON "YtThumbnail"("projectId");

-- CreateIndex
CREATE INDEX "YtThumbnail_createdAt_idx" ON "YtThumbnail"("createdAt");

-- AddForeignKey
ALTER TABLE "YtThumbnail" ADD CONSTRAINT "YtThumbnail_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "YtProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
