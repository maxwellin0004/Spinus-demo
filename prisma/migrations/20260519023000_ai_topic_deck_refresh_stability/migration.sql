ALTER TABLE "CreatorTrendAiTopicDeck" ADD COLUMN "refreshStatus" TEXT NOT NULL DEFAULT 'IDLE';
ALTER TABLE "CreatorTrendAiTopicDeck" ADD COLUMN "refreshFailureCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CreatorTrendAiTopicDeck" ADD COLUMN "refreshRetryAfter" TIMESTAMP(3);
ALTER TABLE "CreatorTrendAiTopicDeck" ADD COLUMN "lastRefreshStartedAt" TIMESTAMP(3);
ALTER TABLE "CreatorTrendAiTopicDeck" ADD COLUMN "lastRefreshFailedAt" TIMESTAMP(3);
ALTER TABLE "CreatorTrendAiTopicDeck" ADD COLUMN "lastRefreshError" TEXT;

CREATE INDEX "CreatorTrendAiTopicDeck_refreshStatus_refreshRetryAfter_idx" ON "CreatorTrendAiTopicDeck"("refreshStatus", "refreshRetryAfter");
