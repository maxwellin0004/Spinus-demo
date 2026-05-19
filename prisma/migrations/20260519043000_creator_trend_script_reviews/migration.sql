CREATE TABLE "CreatorTrendScriptReview" (
  "id" TEXT NOT NULL,
  "scriptGenerationId" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'READY',
  "score" INTEGER,
  "summary" TEXT,
  "checksJson" JSONB,
  "imageFindingsJson" JSONB,
  "riskItemsJson" JSONB,
  "suggestionsJson" JSONB,
  "rawResponseJson" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreatorTrendScriptReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorTrendScriptReview_scriptGenerationId_inputHash_model_key"
ON "CreatorTrendScriptReview"("scriptGenerationId", "inputHash", "model");

CREATE INDEX "CreatorTrendScriptReview_scriptGenerationId_updatedAt_idx"
ON "CreatorTrendScriptReview"("scriptGenerationId", "updatedAt");

CREATE INDEX "CreatorTrendScriptReview_status_updatedAt_idx"
ON "CreatorTrendScriptReview"("status", "updatedAt");

ALTER TABLE "CreatorTrendScriptReview"
ADD CONSTRAINT "CreatorTrendScriptReview_scriptGenerationId_fkey"
FOREIGN KEY ("scriptGenerationId") REFERENCES "CreatorTrendScriptGeneration"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
