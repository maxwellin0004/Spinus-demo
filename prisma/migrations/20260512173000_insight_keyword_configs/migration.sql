-- CreateTable
CREATE TABLE "InsightKeywordConfig" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "keywordType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "perRunLimit" INTEGER NOT NULL DEFAULT 10,
    "collectIntervalHours" INTEGER NOT NULL DEFAULT 24,
    "lastCollectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightKeywordConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsightKeywordConfig_platform_keyword_keywordType_key" ON "InsightKeywordConfig"("platform", "keyword", "keywordType");
CREATE INDEX "InsightKeywordConfig_active_priority_idx" ON "InsightKeywordConfig"("active", "priority");
CREATE INDEX "InsightKeywordConfig_platform_endpoint_idx" ON "InsightKeywordConfig"("platform", "endpoint");
CREATE INDEX "InsightKeywordConfig_lastCollectedAt_idx" ON "InsightKeywordConfig"("lastCollectedAt");
