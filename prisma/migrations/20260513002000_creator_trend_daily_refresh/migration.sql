-- Add Admin-controlled daily refresh settings for creator trend snapshots.
ALTER TABLE "PlatformSettings"
ADD COLUMN "creatorTrendRefreshEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "creatorTrendRefreshHourUtc" INTEGER NOT NULL DEFAULT 19,
ADD COLUMN "creatorTrendRefreshDirections" TEXT[] NOT NULL DEFAULT ARRAY['beauty']::TEXT[],
ADD COLUMN "creatorTrendRefreshBatchCount" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "creatorTrendRefreshLastRunAt" TIMESTAMP(3),
ADD COLUMN "creatorTrendRefreshLastStatus" TEXT,
ADD COLUMN "creatorTrendRefreshLastError" TEXT;

CREATE TABLE "CreatorTrendDailySnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "direction" TEXT NOT NULL,
    "overview" JSONB NOT NULL,
    "trendSeries" JSONB NOT NULL,
    "topicRows" JSONB NOT NULL,
    "recommendationBatches" JSONB NOT NULL,
    "caseStudy" JSONB,
    "source" TEXT NOT NULL DEFAULT 'daily_refresh',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorTrendDailySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorTrendDailySnapshot_date_direction_key" ON "CreatorTrendDailySnapshot"("date", "direction");
CREATE INDEX "CreatorTrendDailySnapshot_direction_generatedAt_idx" ON "CreatorTrendDailySnapshot"("direction", "generatedAt");
