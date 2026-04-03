-- CreateEnum
CREATE TYPE "YtProjectStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "YtProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shootingDate" TIMESTAMP(3),
    "status" "YtProjectStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YtProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YtReferenceVideo" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelId" TEXT,
    "title" TEXT NOT NULL,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "viewSubRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'ko',
    "thumbnailUrl" TEXT,
    "transcript" TEXT,
    "introAnalysis" TEXT,
    "contentAnalysis" TEXT,
    "whatToSay" TEXT,
    "structureAnalysis" TEXT,
    "lessonsLearned" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YtReferenceVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YtProductionData" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "coreValue" TEXT,
    "introSources" JSONB,
    "introDrafts" JSONB,
    "scriptDraft" TEXT,
    "thumbnailStrategies" JSONB,
    "titles" JSONB,
    "hashtags" JSONB,
    "description" TEXT,
    "timeline" TEXT,
    "opusReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YtProductionData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YtSkillNote" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YtSkillNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YtProject_status_idx" ON "YtProject"("status");
CREATE INDEX "YtProject_createdAt_idx" ON "YtProject"("createdAt");

-- CreateIndex
CREATE INDEX "YtReferenceVideo_projectId_idx" ON "YtReferenceVideo"("projectId");
CREATE INDEX "YtReferenceVideo_viewSubRatio_idx" ON "YtReferenceVideo"("viewSubRatio");

-- CreateIndex
CREATE INDEX "YtProductionData_projectId_idx" ON "YtProductionData"("projectId");

-- CreateIndex
CREATE INDEX "YtSkillNote_category_idx" ON "YtSkillNote"("category");

-- AddForeignKey
ALTER TABLE "YtReferenceVideo" ADD CONSTRAINT "YtReferenceVideo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "YtProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YtProductionData" ADD CONSTRAINT "YtProductionData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "YtProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
