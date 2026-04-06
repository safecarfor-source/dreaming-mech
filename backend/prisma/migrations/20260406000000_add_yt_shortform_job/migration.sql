-- CreateTable
CREATE TABLE "YtShortformJob" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "externalJobId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "fileName" TEXT,
    "results" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YtShortformJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YtShortformJob_projectId_idx" ON "YtShortformJob"("projectId");

-- CreateIndex
CREATE INDEX "YtShortformJob_externalJobId_idx" ON "YtShortformJob"("externalJobId");

-- AddForeignKey
ALTER TABLE "YtShortformJob" ADD CONSTRAINT "YtShortformJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "YtProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
