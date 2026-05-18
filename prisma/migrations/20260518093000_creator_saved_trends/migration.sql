CREATE TABLE "CreatorSavedTrend" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT,
    "platform" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SAVED',
    "reason" TEXT,
    "sourceContentId" TEXT,
    "sourceUrl" TEXT,
    "plannedPublishDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorSavedTrend_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorSavedTrend_creatorId_title_platform_key" ON "CreatorSavedTrend"("creatorId", "title", "platform");
CREATE INDEX "CreatorSavedTrend_creatorId_status_createdAt_idx" ON "CreatorSavedTrend"("creatorId", "status", "createdAt");
CREATE INDEX "CreatorSavedTrend_creatorId_updatedAt_idx" ON "CreatorSavedTrend"("creatorId", "updatedAt");

ALTER TABLE "CreatorSavedTrend" ADD CONSTRAINT "CreatorSavedTrend_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
