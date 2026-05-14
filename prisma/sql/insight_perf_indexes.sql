-- Insight query performance indexes
-- Safe to run multiple times.

CREATE INDEX IF NOT EXISTS "idx_insight_topic_date_heat"
  ON "InsightTopic" ("date", "heatScore");

CREATE INDEX IF NOT EXISTS "idx_insight_topic_date_updated"
  ON "InsightTopic" ("date", "updatedAt");

CREATE INDEX IF NOT EXISTS "idx_insight_content_keyword_created"
  ON "InsightContent" ("keyword", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_insight_content_created"
  ON "InsightContent" ("createdAt");

CREATE INDEX IF NOT EXISTS "idx_insight_content_platform_created"
  ON "InsightContent" ("platform", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_insight_content_created_heat"
  ON "InsightContent" ("createdAt", "heatScore");

CREATE INDEX IF NOT EXISTS "idx_insight_content_created_updated"
  ON "InsightContent" ("createdAt", "updatedAt");

CREATE INDEX IF NOT EXISTS "idx_insight_comment_content_created"
  ON "InsightComment" ("contentId", "createdAt");

CREATE INDEX IF NOT EXISTS "idx_insight_comment_content_like"
  ON "InsightComment" ("contentId", "likeCount");

CREATE INDEX IF NOT EXISTS "idx_insight_comment_created"
  ON "InsightComment" ("createdAt");

CREATE INDEX IF NOT EXISTS "idx_insight_trend_keyword_date"
  ON "InsightTrendSnapshot" ("keyword", "date");

CREATE INDEX IF NOT EXISTS "idx_insight_trend_platform_date_heat"
  ON "InsightTrendSnapshot" ("platform", "date", "heatScore");

