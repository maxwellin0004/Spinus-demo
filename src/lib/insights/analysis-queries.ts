import { deriveContentRecommendations, deriveTopicAdvice, summarizeCommentSignals } from "@/lib/insights/analysis";
import type { PainPointSummary } from "@/lib/insights/analysis";
import { getInsightDirectionTerms } from "@/lib/insights/directions";
import { rewriteRecommendationsWithAi } from "@/lib/insights/recommendation-ai";
import { DEFAULT_INSIGHT_AI_MODEL } from "@/lib/insights/ai-prompts";
import type { InsightScopedFilters } from "@/lib/insights/queries";
import { withSharedInsightCache } from "@/lib/insights/cache";
import { prisma } from "@/lib/prisma";

const INSIGHT_ANALYSIS_CACHE_MAX = 200;

const DEFAULT_INSIGHT_AI_SETTINGS = {
  insightAiEnabled: false,
  insightAiBaseUrl: null,
  insightAiApiKey: null,
  insightAiModel: DEFAULT_INSIGHT_AI_MODEL,
  insightAiSystemPrompt: "",
  insightAiScriptSystemPrompt: "",
  insightAiGraphicScriptSystemPrompt: "",
  insightAiVideoScriptSystemPrompt: "",
} as const;

async function withInsightAnalysisCache<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
  return withSharedInsightCache({
    namespace: "insights-analysis",
    key,
    ttlMs,
    maxEntries: INSIGHT_ANALYSIS_CACHE_MAX,
    loader,
  });
}

function since(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function clampDays(value: number | undefined, fallback: number) {
  const days = Number.isFinite(value) ? Number(value) : fallback;
  return Math.max(1, Math.min(90, Math.trunc(days)));
}

function normalizeScopedFilters(filters?: InsightScopedFilters, fallbackDays = 30) {
  const days = clampDays(filters?.days, fallbackDays);
  const platform = filters?.platform && filters.platform !== "all" ? filters.platform : undefined;
  const keyword = filters?.keyword?.trim() || undefined;
  const terms = getInsightDirectionTerms(filters?.directionSlug);
  return { days, platform, keyword, terms };
}

function matchesDirectionText(text: string, terms: string[]) {
  if (terms.length === 0) return true;
  return terms.some((term) => text.includes(term));
}

function matchesKeywordText(text: string, keyword?: string) {
  if (!keyword) return true;
  return text.includes(keyword);
}

function contentMatchesScope(
  content: { title: string; description?: string | null; keyword?: string | null },
  terms: string[],
  keyword?: string,
) {
  const text = `${content.title} ${content.description ?? ""} ${content.keyword ?? ""}`;
  return matchesDirectionText(text, terms) && matchesKeywordText(text, keyword);
}

export async function getBrandInsightAnalysis(filters?: InsightScopedFilters) {
  const cacheKey = JSON.stringify({
    direction: filters?.directionSlug ?? "all",
    platform: filters?.platform ?? "all",
    keyword: filters?.keyword?.trim() ?? "",
    days: filters?.days ?? 30,
  });
  return withInsightAnalysisCache(`brand-analysis:${cacheKey}`, 60_000, async () => {
  const scoped = normalizeScopedFilters(filters, 30);
  const [contents, settingsRecord] = await Promise.all([
    prisma.insightContent.findMany({
      where: {
        createdAt: { gte: since(scoped.days) },
        ...(scoped.platform ? { platform: scoped.platform } : {}),
      },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 500,
    }),
    prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        insightAiEnabled: true,
        insightAiBaseUrl: true,
        insightAiApiKey: true,
        insightAiModel: true,
        insightAiSystemPrompt: true,
        insightAiScriptSystemPrompt: true,
        insightAiGraphicScriptSystemPrompt: true,
        insightAiVideoScriptSystemPrompt: true,
      },
    }),
  ]);
  const settings = settingsRecord ?? DEFAULT_INSIGHT_AI_SETTINGS;

  const scopedContents = contents.filter((content) => contentMatchesScope(content, scoped.terms, scoped.keyword)).slice(0, 200);
  const scopedContentIds = scopedContents.map((item) => item.id);
  const comments = scopedContentIds.length
    ? await prisma.insightComment.findMany({
        where: {
          createdAt: { gte: since(scoped.days) },
          contentId: { in: scopedContentIds },
        },
        orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
        take: 800,
      })
    : [];

  const summary = summarizeCommentSignals(comments);
  const contentLabelById = new Map(
    scopedContents.map((content) => {
      const keyword = content.keyword?.trim();
      const titleSeed = content.title.trim().slice(0, 14);
      const label = keyword && keyword.length <= 10 ? keyword : titleSeed || "话题讨论";
      return [content.id, label] as const;
    }),
  );
  const fallbackPainPoints: PainPointSummary[] =
    summary.painPoints.length > 0 || comments.length === 0
      ? summary.painPoints
      : Array.from(
          comments.reduce((acc, comment) => {
            const label = contentLabelById.get(comment.contentId);
            if (!label) return acc;
            const current = acc.get(label) ?? { mentions: 0, negative: 0, sample: comment.text };
            current.mentions += 1;
            if (comment.sentiment === "负面") {
              current.negative += 1;
            }
            if (!current.sample) {
              current.sample = comment.text;
            }
            acc.set(label, current);
            return acc;
          }, new Map<string, { mentions: number; negative: number; sample: string }>()),
        )
          .sort(([, left], [, right]) => right.mentions - left.mentions)
          .slice(0, 4)
          .map(([keyword, item]) => ({
            keyword,
            mentions: item.mentions,
            sentiment: (item.negative / item.mentions >= 0.4 ? "负面" : item.negative > 0 ? "中性" : "正面") as PainPointSummary["sentiment"],
            sample: item.sample,
          }));
  const commentCountByContentId = new Map<string, number>();
  const commentTextsByContentId = new Map<string, string[]>();
  for (const comment of comments) {
    commentCountByContentId.set(comment.contentId, (commentCountByContentId.get(comment.contentId) ?? 0) + 1);
    const texts = commentTextsByContentId.get(comment.contentId) ?? [];
    texts.push(comment.text);
    commentTextsByContentId.set(comment.contentId, texts);
  }

  const recommendationTargets = scopedContents.filter((content) => content.heatScore >= 35).slice(0, 4);
  const baseRecommendations = deriveContentRecommendations(recommendationTargets, commentCountByContentId, commentTextsByContentId);
  const recommendations = await rewriteRecommendationsWithAi(baseRecommendations, commentTextsByContentId, settings);

  return {
    metrics: {
      voiceCount: scopedContents.length,
      interactionCount: scopedContents.reduce((sum, item) => sum + item.likeCount + item.commentCount + item.shareCount + item.collectCount, 0),
      positiveRate: summary.positiveRate,
      negativeAlerts: summary.totals.negative,
    },
    painPoints: fallbackPainPoints,
    risks: summary.risks,
    recommendations,
    comments: summary.comments,
  };
  });
}

export async function getCreatorInsightAnalysis(directionSlug?: string) {
  return withInsightAnalysisCache(`creator-analysis:${directionSlug ?? "all"}`, 60_000, async () => {
  const terms = getInsightDirectionTerms(directionSlug);
  const [topics, contents, comments, settingsRecord] = await Promise.all([
    prisma.insightTopic.findMany({
      where: { date: { gte: since(7) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 160,
    }),
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 240,
    }),
    prisma.insightComment.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: 400,
    }),
    prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        insightAiEnabled: true,
        insightAiBaseUrl: true,
        insightAiApiKey: true,
        insightAiModel: true,
        insightAiSystemPrompt: true,
        insightAiScriptSystemPrompt: true,
        insightAiGraphicScriptSystemPrompt: true,
        insightAiVideoScriptSystemPrompt: true,
      },
    }),
  ]);
  const settings = settingsRecord ?? DEFAULT_INSIGHT_AI_SETTINGS;

  const scopedTopics = topics
    .filter((topic) => matchesDirectionText(`${topic.topic} ${topic.category ?? ""}`, terms))
    .slice(0, 10);
  const scopedContents = contents
    .filter((content) => contentMatchesScope(content, terms))
    .slice(0, 80);
  const scopedContentIds = new Set(scopedContents.map((item) => item.id));
  const scopedComments = comments
    .filter((comment) => scopedContentIds.has(comment.contentId) || matchesDirectionText(comment.text, terms))
    .slice(0, 240);

  const summary = summarizeCommentSignals(scopedComments);
  const commentCountByContentId = new Map<string, number>();
  const commentTextsByContentId = new Map<string, string[]>();
  for (const comment of scopedComments) {
    commentCountByContentId.set(comment.contentId, (commentCountByContentId.get(comment.contentId) ?? 0) + 1);
    const texts = commentTextsByContentId.get(comment.contentId) ?? [];
    texts.push(comment.text);
    commentTextsByContentId.set(comment.contentId, texts);
  }

  const topicsWithAdvice = scopedTopics.map((topic) => ({
    topic: topic.topic,
    ...deriveTopicAdvice(topic),
    heat: Math.round(topic.heatScore),
    platforms: topic.platforms,
    stage: topic.stage,
  }));

  const recommendationSource = scopedContents.length > 3 ? scopedContents.slice(1) : scopedContents;
  const baseRecommendations = deriveContentRecommendations(recommendationSource, commentCountByContentId, commentTextsByContentId);
  const recommendations = await rewriteRecommendationsWithAi(baseRecommendations, commentTextsByContentId, settings);

  return {
    overview: {
      trackableTopics: scopedTopics.length,
      matchOpportunities: scopedTopics.filter((topic) => topic.heatScore >= 70).length,
      highPotential: scopedContents.filter((item) => item.heatScore >= 50).length,
      overheated: scopedTopics.filter((topic) => topic.heatScore >= 85).length,
    },
    topics: topicsWithAdvice,
    comments: summary,
    recommendations,
  };
  });
}
