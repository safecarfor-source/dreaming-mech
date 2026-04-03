-- CreateTable
CREATE TABLE "YtChannel" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "videoCount" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT NOT NULL DEFAULT '정비',
    "memo" TEXT,
    "avgViewCount" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YtChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YtCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YtCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YtChannel_channelId_key" ON "YtChannel"("channelId");
CREATE INDEX "YtChannel_category_idx" ON "YtChannel"("category");
CREATE UNIQUE INDEX "YtCategory_name_key" ON "YtCategory"("name");

-- Seed default categories
INSERT INTO "YtCategory" ("id", "name", "sortOrder") VALUES
    (gen_random_uuid()::text, '초보운전', 1),
    (gen_random_uuid()::text, '타이어', 2),
    (gen_random_uuid()::text, '정비', 3),
    (gen_random_uuid()::text, '자동차꿀팁', 4),
    (gen_random_uuid()::text, '세차', 5);
