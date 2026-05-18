import type { InsightContent, PlatformSettings, Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { DEFAULT_INSIGHT_AI_TOPIC_DECK_PROMPT, INSIGHT_TOPIC_DECK_PROMPT_VERSION } from "@/lib/insights/ai-prompts";
import { evaluateInsightConfidence } from "@/lib/insights/credibility";
import {
  isInsightAiConfigured,
  readInsightAiRuntimeConfig,
  requestInsightAiJsonDetailed,
  type AiRuntimeSettings,
} from "@/lib/insights/recommendation-ai";
import { prisma } from "@/lib/prisma";
import { extractCoverImageUrl } from "@/lib/tikhub/mappers";

const AI_TOPIC_DECK_SIZE = 12;
const AI_TOPIC_DECK_BATCH_COUNT = 4;
const AI_TOPIC_DECK_ITEMS_PER_BATCH = 3;

type TopicDeckSettings = AiRuntimeSettings & Pick<PlatformSettings, "insightAiSystemPrompt">;

type SourceContent = Pick<
  InsightContent,
  | "id"
  | "sourceContentId"
  | "title"
  | "description"
  | "keyword"
  | "platform"
  | "authorName"
  | "contentUrl"
  | "likeCount"
  | "commentCount"
  | "collectCount"
  | "shareCount"
  | "heatScore"
  | "updatedAt"
  | "rawPayload"
>;

type AiTopicDeckPayload = {
  items?: AiTopicDeckRawItem[];
};

type AiTopicDeckRawItem = {
  itemIndex?: number;
  targetPlatform?: string;
  title?: string;
  reason?: string;
  evidenceSummary?: string;
  keyword?: string;
  stage?: string;
  heat?: string;
  tags?: string[];
  angles?: string[];
  coverImagePrompt?: string;
  coverNegativePrompt?: string;
  sourceContentIds?: string[];
  primarySourceContentId?: string;
};

export type AiTopicDeckCard = {
  id: string;
  title: string;
  stage: "爆发中" | "长尾可做";
  reason: string;
  evidenceSummary?: string;
  platform?: string;
  tags: string[];
  heat: string;
  tone: string;
  keyword?: string;
  creator?: string;
  sampleTitle?: string;
  sampleContentUrl?: string;
  sampleSourceContentId?: string;
  sampleCoverImageUrl?: string;
  referenceSourceContentIds?: string[];
  metrics?: {
    likes: number;
    comments: number;
    collects: number;
    shares: number;
  };
  angles?: string[];
  coverImageUrl?: string;
  coverImagePrompt?: string;
  coverNegativePrompt?: string;
  updatedAt?: string;
  sampleCount?: number;
  commentSampleCount?: number;
  platformSourceCount?: number;
  confidence?: "高可信" | "中可信" | "低可信" | "示例数据";
};

export type AiTopicDeckResult = {
  status: "READY" | "FAILED";
  source: "AI生成" | "示例兜底";
  items: AiTopicDeckCard[];
  errorMessage: string | null;
  generatedAt: string | null;
  sampleSignature: string;
  cacheKey: string;
  cached: boolean;
};

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function cleanText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function cleanStringList(value: unknown, limit: number) {
  return Array.isArray(value) ? value.map((item) => cleanText(item, limit)).filter(Boolean) : [];
}

function normalizePlatform(value: unknown, fallback: string) {
  if (fallback !== "all") return fallback;
  const text = cleanText(value, 40).toLowerCase();
  if (text.includes("小红书") || text === "xhs" || text === "xiaohongshu") return "xiaohongshu";
  if (text.includes("抖音") || text === "douyin" || text === "tiktok") return "douyin";
  if (text.includes("b站") || text.includes("bilibili") || text === "bili") return "bilibili";
  if (text.includes("微博") || text === "weibo") return "weibo";
  return "xiaohongshu";
}

function platformLabel(platform: string) {
  const map: Record<string, string> = {
    xiaohongshu: "小红书",
    douyin: "抖音",
    bilibili: "B站",
    weibo: "微博",
  };
  return map[platform] ?? platform;
}

function toneForIndex(index: number) {
  return index % 4 === 0
    ? "from-violet-100 to-teal-50"
    : index % 4 === 1
      ? "from-cyan-100 to-blue-50"
      : index % 4 === 2
        ? "from-amber-100 to-rose-50"
        : "from-emerald-100 to-lime-50";
}

function normalizeStage(value: unknown): "爆发中" | "长尾可做" {
  const text = cleanText(value, 20);
  return text.includes("长尾") ? "长尾可做" : "爆发中";
}

function normalizeHeat(value: unknown, fallbackScore: number) {
  const text = cleanText(value, 20);
  const parsed = Number.parseInt(text, 10);
  const score = Number.isFinite(parsed) ? parsed : Math.round(fallbackScore);
  return `${Math.max(60, Math.min(100, score))}分`;
}

function resolveTopicDeckPrompt(settings: Pick<PlatformSettings, "insightAiSystemPrompt">) {
  const prompt = settings.insightAiSystemPrompt?.trim() ?? "";
  if (prompt.includes(INSIGHT_TOPIC_DECK_PROMPT_VERSION)) return prompt;
  return DEFAULT_INSIGHT_AI_TOPIC_DECK_PROMPT;
}

function buildSampleIds(contents: SourceContent[]) {
  return contents.map((content) => content.id).filter(Boolean);
}

export function buildAiTopicDeckSampleSignature(contents: SourceContent[]) {
  return sha256(buildSampleIds(contents).join("\n"));
}

function buildCacheKey(input: { direction: string; platform: string; keyword: string; sampleSignature: string }) {
  return sha256([input.direction, input.platform, input.keyword.trim(), input.sampleSignature].join("\n"));
}

function sourceSignal(content: SourceContent, comments: string[]) {
  const engagement = content.likeCount + content.commentCount + content.collectCount + content.shareCount;
  return {
    sourceContentId: content.id,
    platformSourceContentId: content.sourceContentId,
    sampleTitle: content.title,
    sampleDescription: content.description?.slice(0, 160) ?? "",
    keyword: content.keyword,
    platform: content.platform,
    platformLabel: platformLabel(content.platform),
    creator: content.authorName,
    metrics: {
      likes: content.likeCount,
      comments: content.commentCount,
      collects: content.collectCount,
      shares: content.shareCount,
      engagement,
      heatScore: Math.round(content.heatScore),
    },
    commentSnippets: comments.slice(0, 4).map((comment) => comment.replace(/\s+/g, " ").trim().slice(0, 100)),
  };
}

function sanitizeRawItem(item: AiTopicDeckRawItem, index: number, fallbackPlatform: string, validSourceIds: Set<string>) {
  const sourceIds = cleanStringList(item.sourceContentIds, 120).filter((id) => validSourceIds.has(id));
  const primary = validSourceIds.has(cleanText(item.primarySourceContentId, 120))
    ? cleanText(item.primarySourceContentId, 120)
    : sourceIds[0];
  const title = cleanText(item.title, 80);
  const reason = cleanText(item.reason, 260);
  const coverImagePrompt = cleanText(item.coverImagePrompt, 1200);

  if (!title || !reason || !primary || !coverImagePrompt) return null;

  const targetPlatform = normalizePlatform(item.targetPlatform, fallbackPlatform);
  const tags = cleanStringList(item.tags, 24).slice(0, 3);
  const angles = cleanStringList(item.angles, 160).slice(0, 3);

  return {
    itemIndex: index,
    targetPlatform,
    title,
    reason,
    evidenceSummary: cleanText(item.evidenceSummary, 260),
    keyword: cleanText(item.keyword, 40),
    stage: normalizeStage(item.stage),
    heat: normalizeHeat(item.heat, 88),
    tags: Array.from(new Set([...(tags.length ? tags : []), platformLabel(targetPlatform), "AI选题"])).slice(0, 3),
    angles: angles.length ? angles : [reason],
    coverImagePrompt,
    coverNegativePrompt:
      cleanText(item.coverNegativePrompt, 600) ||
      "不要生成中文文字，不要水印，不要品牌 logo，不要广告海报感，不要低清晰度，不要畸形手部，不要杂乱背景，不要虚假产品包装",
    sourceContentIds: Array.from(new Set([primary, ...sourceIds])).slice(0, 4),
    primarySourceContentId: primary,
  } satisfies Required<AiTopicDeckRawItem>;
}

function normalizeAiItems(payload: AiTopicDeckPayload | null, fallbackPlatform: string, validSourceIds: Set<string>) {
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const seenTitles = new Set<string>();
  const normalized: Required<AiTopicDeckRawItem>[] = [];

  for (const raw of rawItems) {
    const item = sanitizeRawItem(raw, normalized.length, fallbackPlatform, validSourceIds);
    if (!item) continue;
    const titleKey = item.title.replace(/\s+/g, "");
    if (seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);
    normalized.push(item);
    if (normalized.length >= AI_TOPIC_DECK_SIZE) break;
  }

  if (normalized.length < AI_TOPIC_DECK_SIZE) {
    throw new Error(`AI 只返回了 ${normalized.length} 张有效选题，未达到 12 张。`);
  }

  return normalized.map((item, index) => ({ ...item, itemIndex: index }));
}

function mapItemsToCards(params: {
  cacheKey: string;
  items: Required<AiTopicDeckRawItem>[];
  sourceById: Map<string, SourceContent>;
  commentsByContentId: Map<string, string[]>;
}) {
  return params.items.map<AiTopicDeckCard>((item, index) => {
    const primarySource = params.sourceById.get(item.primarySourceContentId) ?? params.sourceById.get(item.sourceContentIds[0]);
    const sourceContents = item.sourceContentIds.map((id) => params.sourceById.get(id)).filter(Boolean) as SourceContent[];
    const commentSampleCount = sourceContents.reduce((sum, content) => sum + (params.commentsByContentId.get(content.id)?.length || content.commentCount || 0), 0);
    const updatedAt = sourceContents
      .map((content) => content.updatedAt)
      .sort((left, right) => right.getTime() - left.getTime())[0];
    const sourceMetrics = primarySource
      ? {
          likes: primarySource.likeCount,
          comments: primarySource.commentCount,
          collects: primarySource.collectCount,
          shares: primarySource.shareCount,
        }
      : undefined;

    return {
      id: `ai-topic:${params.cacheKey}:${index}`,
      title: item.title,
      stage: normalizeStage(item.stage),
      reason: item.reason,
      evidenceSummary: item.evidenceSummary,
      platform: item.targetPlatform,
      tags: item.tags,
      heat: item.heat,
      tone: toneForIndex(index),
      keyword: item.keyword || item.title,
      creator: primarySource?.authorName ?? "热门样本",
      sampleTitle: primarySource?.title,
      sampleContentUrl: primarySource?.contentUrl ?? undefined,
      sampleSourceContentId: primarySource?.sourceContentId || primarySource?.id,
      sampleCoverImageUrl: primarySource ? extractCoverImageUrl(primarySource.rawPayload) : undefined,
      referenceSourceContentIds: item.sourceContentIds,
      metrics: sourceMetrics,
      angles: item.angles,
      coverImageUrl: undefined,
      coverImagePrompt: item.coverImagePrompt,
      coverNegativePrompt: item.coverNegativePrompt,
      updatedAt: updatedAt?.toISOString(),
      sampleCount: sourceContents.length || 1,
      commentSampleCount,
      platformSourceCount: new Set(sourceContents.map((content) => content.platform)).size || 1,
      confidence: evaluateInsightConfidence({
        sourceKind: "AI生成",
        sampleCount: sourceContents.length || 1,
        commentSampleCount,
        platformSourceCount: new Set(sourceContents.map((content) => content.platform)).size || 1,
        updatedAt,
      }),
    };
  });
}

async function writeFailedDeck(params: {
  cacheKey: string;
  direction: string;
  platform: string;
  keyword: string;
  sampleSignature: string;
  sampleContentIds: string[];
  model: string;
  promptHash: string;
  message: string;
}) {
  await prisma.creatorTrendAiTopicDeck.upsert({
    where: { cacheKey: params.cacheKey },
    update: {
      model: params.model,
      promptHash: params.promptHash,
      sampleContentIds: params.sampleContentIds,
      status: "FAILED",
      errorMessage: params.message,
      items: jsonInput([]),
      generatedAt: new Date(),
    },
    create: {
      cacheKey: params.cacheKey,
      direction: params.direction,
      platform: params.platform,
      keyword: params.keyword,
      sampleSignature: params.sampleSignature,
      sampleContentIds: params.sampleContentIds,
      model: params.model,
      promptHash: params.promptHash,
      batchCount: AI_TOPIC_DECK_BATCH_COUNT,
      itemsPerBatch: AI_TOPIC_DECK_ITEMS_PER_BATCH,
      items: jsonInput([]),
      status: "FAILED",
      errorMessage: params.message,
      generatedAt: new Date(),
    },
  });
}

export async function getOrGenerateAiTopicDeck(params: {
  direction: string;
  directionLabel: string;
  platform: string;
  keyword: string;
  sourceContents: SourceContent[];
  commentsByContentId: Map<string, string[]>;
  settings: TopicDeckSettings;
  force?: boolean;
}): Promise<AiTopicDeckResult> {
  const sampleContentIds = buildSampleIds(params.sourceContents);
  const sampleSignature = buildAiTopicDeckSampleSignature(params.sourceContents);
  const cacheKey = buildCacheKey({
    direction: params.direction,
    platform: params.platform,
    keyword: params.keyword,
    sampleSignature,
  });
  const sourceById = new Map(params.sourceContents.map((content) => [content.id, content]));
  const runtime = readInsightAiRuntimeConfig(params.settings);
  const systemPrompt = resolveTopicDeckPrompt(params.settings);
  const promptHash = sha256(systemPrompt);
  const baseResult = {
    sampleSignature,
    cacheKey,
    generatedAt: null,
  };

  if (params.sourceContents.length === 0) {
    return {
      ...baseResult,
      status: "FAILED",
      source: "示例兜底",
      items: [],
      errorMessage: "当前筛选下没有可用于 AI 选题的热门样本。",
      cached: false,
    };
  }

  if (!isInsightAiConfigured(params.settings)) {
    return {
      ...baseResult,
      status: "FAILED",
      source: "示例兜底",
      items: [],
      errorMessage: "AI 选题模型未配置或未启用。",
      cached: false,
    };
  }

  if (!params.force) {
    const cached = await prisma.creatorTrendAiTopicDeck.findUnique({ where: { cacheKey } });
    if (cached?.status === "READY") {
      const cachedItems = Array.isArray(cached.items) ? (cached.items as Required<AiTopicDeckRawItem>[]) : [];
      return {
        ...baseResult,
        status: "READY",
        source: "AI生成",
        items: mapItemsToCards({ cacheKey, items: cachedItems.slice(0, AI_TOPIC_DECK_SIZE), sourceById, commentsByContentId: params.commentsByContentId }),
        errorMessage: null,
        generatedAt: cached.generatedAt?.toISOString() ?? cached.updatedAt.toISOString(),
        cached: true,
      };
    }
    if (cached?.status === "FAILED") {
      return {
        ...baseResult,
        status: "FAILED",
        source: "示例兜底",
        items: [],
        errorMessage: cached.errorMessage ?? "AI 选题生成失败，请点击重新生成。",
        generatedAt: cached.generatedAt?.toISOString() ?? cached.updatedAt.toISOString(),
        cached: true,
      };
    }
  }

  try {
    const result = await requestInsightAiJsonDetailed<AiTopicDeckPayload>({
      settings: params.settings,
      systemPrompt,
      instruction:
        "请基于 sampleSignals 一次性生成 12 张全新的 AI 选题卡。热门帖只作为依据，不得复制原帖标题结构、原帖封面人物/姿势/场景。每张卡必须有新标题、新推荐理由、目标平台、证据摘要、3 个创作角度、gpt-image-2 无文字封面提示词和负向提示词。只返回 JSON。",
      input: {
        direction: params.direction,
        directionLabel: params.directionLabel,
        targetPlatform: params.platform,
        targetPlatformLabel: params.platform === "all" ? "全部平台" : platformLabel(params.platform),
        keyword: params.keyword,
        deckRules: {
          totalItems: AI_TOPIC_DECK_SIZE,
          batchCount: AI_TOPIC_DECK_BATCH_COUNT,
          itemsPerBatch: AI_TOPIC_DECK_ITEMS_PER_BATCH,
          cachePolicy: "同一热门样本签名复用，手动重新生成才覆盖。",
          imagePolicy: "coverImagePrompt 必须和 title 一一对应，图片内不要生成中文文字。",
        },
        sampleSignals: params.sourceContents.map((content) => sourceSignal(content, params.commentsByContentId.get(content.id) ?? [])),
      },
      maxTokens: 5200,
    });

    if (!result.parsed) {
      throw new Error(result.errorMessage ?? "AI 选题生成失败。");
    }

    const items = normalizeAiItems(result.parsed, params.platform, new Set(sampleContentIds));
    const now = new Date();
    await prisma.creatorTrendAiTopicDeck.upsert({
      where: { cacheKey },
      update: {
        direction: params.direction,
        platform: params.platform,
        keyword: params.keyword,
        sampleSignature,
        sampleContentIds,
        model: runtime.model,
        promptHash,
        batchCount: AI_TOPIC_DECK_BATCH_COUNT,
        itemsPerBatch: AI_TOPIC_DECK_ITEMS_PER_BATCH,
        items: jsonInput(items),
        status: "READY",
        errorMessage: null,
        generatedAt: now,
      },
      create: {
        cacheKey,
        direction: params.direction,
        platform: params.platform,
        keyword: params.keyword,
        sampleSignature,
        sampleContentIds,
        model: runtime.model,
        promptHash,
        batchCount: AI_TOPIC_DECK_BATCH_COUNT,
        itemsPerBatch: AI_TOPIC_DECK_ITEMS_PER_BATCH,
        items: jsonInput(items),
        status: "READY",
        errorMessage: null,
        generatedAt: now,
      },
    });

    return {
      ...baseResult,
      status: "READY",
      source: "AI生成",
      items: mapItemsToCards({ cacheKey, items, sourceById, commentsByContentId: params.commentsByContentId }),
      errorMessage: null,
      generatedAt: now.toISOString(),
      cached: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "AI 选题生成失败。";
    await writeFailedDeck({
      cacheKey,
      direction: params.direction,
      platform: params.platform,
      keyword: params.keyword,
      sampleSignature,
      sampleContentIds,
      model: runtime.model,
      promptHash,
      message,
    });
    return {
      ...baseResult,
      status: "FAILED",
      source: "示例兜底",
      items: [],
      errorMessage: message,
      generatedAt: new Date().toISOString(),
      cached: false,
    };
  }
}
