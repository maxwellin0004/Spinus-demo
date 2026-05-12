-- CreateTable
CREATE TABLE "InsightTrendSnapshot" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'tikhub',
    "platform" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "keywordType" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "contentCount" INTEGER NOT NULL DEFAULT 0,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "collectCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "heatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightTrendSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsightTrendSnapshot_source_platform_keyword_date_key" ON "InsightTrendSnapshot"("source", "platform", "keyword", "date");
CREATE INDEX "InsightTrendSnapshot_platform_keyword_date_idx" ON "InsightTrendSnapshot"("platform", "keyword", "date");
CREATE INDEX "InsightTrendSnapshot_date_idx" ON "InsightTrendSnapshot"("date");
CREATE INDEX "InsightTrendSnapshot_heatScore_idx" ON "InsightTrendSnapshot"("heatScore");
