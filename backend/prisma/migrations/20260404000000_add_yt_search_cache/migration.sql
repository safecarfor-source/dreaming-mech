-- CreateTable
CREATE TABLE "YtSearchCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ko',
    "videoDuration" TEXT,
    "results" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YtSearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YtSearchCache_cacheKey_key" ON "YtSearchCache"("cacheKey");

-- CreateIndex
CREATE INDEX "YtSearchCache_expiresAt_idx" ON "YtSearchCache"("expiresAt");
