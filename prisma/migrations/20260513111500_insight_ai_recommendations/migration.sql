ALTER TABLE "PlatformSettings"
ADD COLUMN "insightAiEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "insightAiBaseUrl" TEXT,
ADD COLUMN "insightAiApiKey" TEXT,
ADD COLUMN "insightAiModel" TEXT NOT NULL DEFAULT 'chatgpt-4o-latest',
ADD COLUMN "insightAiSystemPrompt" TEXT NOT NULL DEFAULT '你是中文短视频选题策划。基于真实帖子样本、互动数据和评论痛点，把候选选题改写成更具体、可创作、可执行的中文标题。返回严格 JSON：{"items":[{"sampleSourceContentId":"string","title":"string","reason":"string","angles":["string","string","string"]}]}。标题要求避免空泛词，优先写成问题型、避坑型、对比型或新手痛点型，不要直接照抄原帖标题。';
