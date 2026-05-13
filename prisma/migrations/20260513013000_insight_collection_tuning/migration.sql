ALTER TABLE "PlatformSettings"
ADD COLUMN "insightConfiguredCollectionBatchLimit" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN "insightZeroResultCooldownHours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "insightCommentTargetCount" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "insightCommentPerContentLimit" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN "insightDefaultHotKeywordPerRunLimit" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN "insightDefaultStandardPerRunLimit" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN "insightDefaultHotKeywordIntervalHours" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN "insightDefaultStandardIntervalHours" INTEGER NOT NULL DEFAULT 24;
