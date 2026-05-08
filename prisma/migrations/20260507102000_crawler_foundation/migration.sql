CREATE TYPE "CrawlerPlatform" AS ENUM ('XIAOHONGSHU', 'DOUYIN');

CREATE TYPE "CrawlerJobType" AS ENUM (
  'FETCH_SOCIAL_ACCOUNT',
  'FETCH_POST_METRICS',
  'REFRESH_SOCIAL_ACCOUNT',
  'REFRESH_POST_METRICS'
);

CREATE TYPE "CrawlerTargetType" AS ENUM ('SOCIAL_ACCOUNT', 'PROOF');

CREATE TYPE "CrawlerJobStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "CrawlerSnapshotStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

CREATE TYPE "AuthorMatchStatus" AS ENUM ('MATCHED', 'MISMATCHED', 'UNKNOWN');

CREATE TABLE "CrawlerJob" (
  "id" TEXT NOT NULL,
  "type" "CrawlerJobType" NOT NULL,
  "platform" "CrawlerPlatform" NOT NULL,
  "status" "CrawlerJobStatus" NOT NULL DEFAULT 'PENDING',
  "targetType" "CrawlerTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "socialAccountId" TEXT,
  "proofId" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 2,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "lastErrorMessage" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "CrawlerJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialAccountSnapshot" (
  "id" TEXT NOT NULL,
  "socialAccountId" TEXT NOT NULL,
  "crawlerJobId" TEXT,
  "platform" "CrawlerPlatform" NOT NULL,
  "status" "CrawlerSnapshotStatus" NOT NULL DEFAULT 'PENDING',
  "failureReason" TEXT,
  "displayName" TEXT,
  "profileUrl" TEXT,
  "platformUserId" TEXT,
  "followerCount" INTEGER,
  "followingCount" INTEGER,
  "likeCount" INTEGER,
  "postCount" INTEGER,
  "fetchedAt" TIMESTAMP(3) NOT NULL,
  "rawProvider" TEXT,
  "rawUserId" TEXT,
  "rawCanonicalUrl" TEXT,
  "rawMetricText" TEXT,
  "parserVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SocialAccountSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PostMetricSnapshot" (
  "id" TEXT NOT NULL,
  "proofId" TEXT NOT NULL,
  "crawlerJobId" TEXT,
  "platform" "CrawlerPlatform" NOT NULL,
  "status" "CrawlerSnapshotStatus" NOT NULL DEFAULT 'PENDING',
  "failureReason" TEXT,
  "viewCount" INTEGER,
  "likeCount" INTEGER,
  "favoriteCount" INTEGER,
  "commentCount" INTEGER,
  "shareCount" INTEGER,
  "title" TEXT,
  "authorName" TEXT,
  "authorPlatformUserId" TEXT,
  "publishedAt" TIMESTAMP(3),
  "canonicalUrl" TEXT,
  "platformPostId" TEXT,
  "authorMatchStatus" "AuthorMatchStatus" NOT NULL DEFAULT 'UNKNOWN',
  "fetchedAt" TIMESTAMP(3) NOT NULL,
  "rawProvider" TEXT,
  "rawItemId" TEXT,
  "rawUserId" TEXT,
  "rawCanonicalUrl" TEXT,
  "rawMetricText" TEXT,
  "parserVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PostMetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrawlerJob_status_createdAt_idx" ON "CrawlerJob"("status", "createdAt");
CREATE INDEX "CrawlerJob_status_lockedAt_idx" ON "CrawlerJob"("status", "lockedAt");
CREATE INDEX "CrawlerJob_targetType_targetId_idx" ON "CrawlerJob"("targetType", "targetId");
CREATE INDEX "CrawlerJob_socialAccountId_idx" ON "CrawlerJob"("socialAccountId");
CREATE INDEX "CrawlerJob_proofId_idx" ON "CrawlerJob"("proofId");

CREATE INDEX "SocialAccountSnapshot_socialAccountId_fetchedAt_idx" ON "SocialAccountSnapshot"("socialAccountId", "fetchedAt");
CREATE INDEX "SocialAccountSnapshot_crawlerJobId_idx" ON "SocialAccountSnapshot"("crawlerJobId");
CREATE INDEX "SocialAccountSnapshot_platform_status_idx" ON "SocialAccountSnapshot"("platform", "status");

CREATE INDEX "PostMetricSnapshot_proofId_fetchedAt_idx" ON "PostMetricSnapshot"("proofId", "fetchedAt");
CREATE INDEX "PostMetricSnapshot_crawlerJobId_idx" ON "PostMetricSnapshot"("crawlerJobId");
CREATE INDEX "PostMetricSnapshot_platform_status_idx" ON "PostMetricSnapshot"("platform", "status");
CREATE INDEX "PostMetricSnapshot_authorMatchStatus_idx" ON "PostMetricSnapshot"("authorMatchStatus");

ALTER TABLE "CrawlerJob"
ADD CONSTRAINT "CrawlerJob_socialAccountId_fkey"
FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrawlerJob"
ADD CONSTRAINT "CrawlerJob_proofId_fkey"
FOREIGN KEY ("proofId") REFERENCES "Proof"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialAccountSnapshot"
ADD CONSTRAINT "SocialAccountSnapshot_socialAccountId_fkey"
FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SocialAccountSnapshot"
ADD CONSTRAINT "SocialAccountSnapshot_crawlerJobId_fkey"
FOREIGN KEY ("crawlerJobId") REFERENCES "CrawlerJob"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PostMetricSnapshot"
ADD CONSTRAINT "PostMetricSnapshot_proofId_fkey"
FOREIGN KEY ("proofId") REFERENCES "Proof"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PostMetricSnapshot"
ADD CONSTRAINT "PostMetricSnapshot_crawlerJobId_fkey"
FOREIGN KEY ("crawlerJobId") REFERENCES "CrawlerJob"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
