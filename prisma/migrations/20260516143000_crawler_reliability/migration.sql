ALTER TABLE "CrawlerJob"
ADD COLUMN "lastErrorCategory" TEXT;

ALTER TABLE "SocialAccountSnapshot"
ADD COLUMN "failureCategory" TEXT,
ADD COLUMN "dataConfidence" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "rawEvidence" JSONB;

ALTER TABLE "PostMetricSnapshot"
ADD COLUMN "failureCategory" TEXT,
ADD COLUMN "dataConfidence" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "rawEvidence" JSONB;

ALTER TABLE "PlatformSettings"
ADD COLUMN "crawlerProofRefreshCooldownMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN "crawlerBrandHourlyRefreshLimit" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "crawlerSocialRefreshCooldownMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "crawlerMaxAttempts" INTEGER NOT NULL DEFAULT 2;

CREATE INDEX "SocialAccountSnapshot_failureCategory_idx" ON "SocialAccountSnapshot"("failureCategory");
CREATE INDEX "PostMetricSnapshot_failureCategory_idx" ON "PostMetricSnapshot"("failureCategory");
