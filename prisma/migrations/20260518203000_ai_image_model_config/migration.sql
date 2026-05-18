ALTER TABLE "PlatformSettings"
ADD COLUMN "insightImageAiBaseUrl" TEXT,
ADD COLUMN "insightImageAiApiKey" TEXT,
ADD COLUMN "insightImageAiModel" TEXT NOT NULL DEFAULT 'gpt-image-2';

ALTER TABLE "PlatformSettings"
ALTER COLUMN "insightAiModel" SET DEFAULT 'gpt-5.5';

UPDATE "PlatformSettings"
SET
  "insightAiBaseUrl" = COALESCE(NULLIF(trim("insightAiBaseUrl"), ''), 'https://4router.net/v1'),
  "insightAiModel" = CASE
    WHEN COALESCE(NULLIF(trim("insightAiModel"), ''), '') IN ('', 'chatgpt-4o-latest') THEN 'gpt-5.5'
    ELSE "insightAiModel"
  END,
  "insightImageAiModel" = COALESCE(NULLIF(trim("insightImageAiModel"), ''), 'gpt-image-2');
