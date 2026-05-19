CREATE TABLE "CreatorTrendScriptImage" (
  "id" TEXT NOT NULL,
  "scriptGenerationId" TEXT NOT NULL,
  "pageKey" TEXT NOT NULL,
  "pageLabel" TEXT NOT NULL,
  "pageOrder" INTEGER NOT NULL,
  "model" TEXT NOT NULL,
  "promptHash" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "negativePrompt" TEXT,
  "aspectRatio" TEXT,
  "size" TEXT NOT NULL,
  "imageUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'READY',
  "errorMessage" TEXT,
  "generatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreatorTrendScriptImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorTrendScriptImage_scriptGenerationId_pageKey_promptHash_model_key"
ON "CreatorTrendScriptImage"("scriptGenerationId", "pageKey", "promptHash", "model");

CREATE INDEX "CreatorTrendScriptImage_scriptGenerationId_pageOrder_idx"
ON "CreatorTrendScriptImage"("scriptGenerationId", "pageOrder");

CREATE INDEX "CreatorTrendScriptImage_status_updatedAt_idx"
ON "CreatorTrendScriptImage"("status", "updatedAt");

ALTER TABLE "CreatorTrendScriptImage"
ADD CONSTRAINT "CreatorTrendScriptImage_scriptGenerationId_fkey"
FOREIGN KEY ("scriptGenerationId") REFERENCES "CreatorTrendScriptGeneration"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
