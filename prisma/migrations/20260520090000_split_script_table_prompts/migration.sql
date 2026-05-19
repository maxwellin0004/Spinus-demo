ALTER TABLE "PlatformSettings"
  ADD COLUMN "insightAiGraphicTablePromptsJson" JSONB,
  ADD COLUMN "insightAiVideoTablePromptsJson" JSONB,
  ADD COLUMN "insightAiCaseAnalysisTablePromptsJson" JSONB;
