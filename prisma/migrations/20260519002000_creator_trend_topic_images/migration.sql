CREATE TABLE "CreatorTrendTopicImage" (
  "id" TEXT NOT NULL,
  "cacheKey" TEXT NOT NULL,
  "sourceContentId" TEXT,
  "sourceTitle" TEXT NOT NULL,
  "platform" TEXT,
  "model" TEXT NOT NULL,
  "promptHash" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "negativePrompt" TEXT,
  "imageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'READY',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreatorTrendTopicImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorTrendTopicImage_cacheKey_key" ON "CreatorTrendTopicImage"("cacheKey");
CREATE INDEX "CreatorTrendTopicImage_sourceContentId_idx" ON "CreatorTrendTopicImage"("sourceContentId");
CREATE INDEX "CreatorTrendTopicImage_status_updatedAt_idx" ON "CreatorTrendTopicImage"("status", "updatedAt");
