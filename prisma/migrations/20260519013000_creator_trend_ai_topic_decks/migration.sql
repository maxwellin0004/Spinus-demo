CREATE TABLE "CreatorTrendAiTopicDeck" (
  "id" TEXT NOT NULL,
  "cacheKey" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "keyword" TEXT NOT NULL DEFAULT '',
  "sampleSignature" TEXT NOT NULL,
  "sampleContentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "model" TEXT NOT NULL,
  "promptHash" TEXT NOT NULL,
  "batchCount" INTEGER NOT NULL DEFAULT 4,
  "itemsPerBatch" INTEGER NOT NULL DEFAULT 3,
  "items" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'READY',
  "errorMessage" TEXT,
  "generatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreatorTrendAiTopicDeck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorTrendAiTopicDeck_cacheKey_key" ON "CreatorTrendAiTopicDeck"("cacheKey");
CREATE INDEX "CreatorTrendAiTopicDeck_direction_platform_keyword_idx" ON "CreatorTrendAiTopicDeck"("direction", "platform", "keyword");
CREATE INDEX "CreatorTrendAiTopicDeck_sampleSignature_idx" ON "CreatorTrendAiTopicDeck"("sampleSignature");
CREATE INDEX "CreatorTrendAiTopicDeck_status_updatedAt_idx" ON "CreatorTrendAiTopicDeck"("status", "updatedAt");
