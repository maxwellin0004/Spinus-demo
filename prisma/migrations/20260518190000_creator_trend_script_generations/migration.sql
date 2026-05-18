ALTER TABLE "PlatformSettings"
ADD COLUMN "insightAiCaseAnalysisSystemPrompt" TEXT NOT NULL DEFAULT $prompt$你是中文短视频和小红书爆款案例拆解分析师。请参考 video-analysis-table 方法，把输入案例拆成可复用表格，区分观察事实和模板推断。只返回严格 JSON：{"caseAnalysisTables":[{"id":"basic","title":"基础信息","columns":["字段","内容","证据等级"],"rows":[["案例标题","string","observed"]]}]}。默认输出 10 张核心表：基础信息、标题包装、Hook、内容结构、逐镜头视觉、逐镜头布局、图层、动画特效、字幕音频、素材提示词与复用规则。证据不足时写 estimated 或 none，不要假装看过视频。$prompt$,
ADD COLUMN "insightAiCaseGraphicScriptSystemPrompt" TEXT NOT NULL DEFAULT $prompt$你是中文小红书图文改写策划。请基于爆款案例拆解、互动数据和评论痛点，把案例迁移成新的图文脚本表格。只返回严格 JSON：{"graphicTables":[{"id":"graphic_pages","title":"图文分页脚本表","columns":["页码","页面目标","画面建议","页面文案","排版建议"],"rows":[["封面","string","string","string","string"]]}]}。必须包含选题策略、封面包装、图文分页、图片生成提示词、发布包装、合规避坑 6 张表。图片生成提示词表必须包含正向提示词、负向提示词、画幅、文字叠加说明。$prompt$,
ADD COLUMN "insightAiCaseVideoScriptSystemPrompt" TEXT NOT NULL DEFAULT $prompt$你是中文短视频爆款改写 production script pack 策划。请基于案例拆解表，把爆款结构迁移成可直接拍摄、剪辑、TTS 和 Remotion 实现的视频脚本表格。只返回严格 JSON：{"videoTables":[{"id":"video_structure","title":"视频结构总览表","columns":["段落","时间范围","段落目标","核心信息","停留理由"],"rows":[["hook","0-4s","string","string","string"]]}]}。必须包含视频结构、口播、分镜画面、素材需求、字幕屏幕文字、音频节奏、动画转场、Remotion 映射、发布包装、合规风险 10 张表。$prompt$;

CREATE TABLE "CreatorTrendScriptGeneration" (
  "id" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "savedTrendId" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "sourceTitle" TEXT NOT NULL,
  "platform" TEXT,
  "status" TEXT NOT NULL DEFAULT 'GENERATING',
  "generationMode" TEXT NOT NULL DEFAULT 'FALLBACK',
  "model" TEXT,
  "userInstruction" TEXT,
  "sourcePayload" JSONB,
  "graphicTablesJson" JSONB,
  "videoTablesJson" JSONB,
  "caseAnalysisTablesJson" JSONB,
  "plainText" TEXT,
  "errorMessage" TEXT,
  "generatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CreatorTrendScriptGeneration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreatorTrendScriptGeneration_creatorId_sourceType_sourceKey_key"
ON "CreatorTrendScriptGeneration"("creatorId", "sourceType", "sourceKey");

CREATE INDEX "CreatorTrendScriptGeneration_creatorId_updatedAt_idx"
ON "CreatorTrendScriptGeneration"("creatorId", "updatedAt");

CREATE INDEX "CreatorTrendScriptGeneration_sourceType_status_updatedAt_idx"
ON "CreatorTrendScriptGeneration"("sourceType", "status", "updatedAt");

CREATE INDEX "CreatorTrendScriptGeneration_status_updatedAt_idx"
ON "CreatorTrendScriptGeneration"("status", "updatedAt");

ALTER TABLE "CreatorTrendScriptGeneration"
ADD CONSTRAINT "CreatorTrendScriptGeneration_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
