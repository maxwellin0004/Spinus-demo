import { Prisma } from "@prisma/client";
import { deriveContentRecommendations, type RecommendationSummary } from "@/lib/insights/analysis";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTIONS, getInsightDirectionTerms, isInsightDirectionSlug } from "@/lib/insights/directions";
import { getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";
import { rewriteRecommendationsWithAi } from "@/lib/insights/recommendation-ai";
import { getCreatorTopTopics, getCreatorTrendSeries, getCreatorTrendsOverview } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";
import { extractCoverImageUrl } from "@/lib/tikhub/mappers";

function since(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function matchesDirectionText(text: string, terms: string[]) {
  if (terms.length === 0) return true;
  return terms.some((term) => text.includes(term));
}

export function creatorTrendSnapshotDate(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function platformLabel(platform: string) {
  const map: Record<string, string> = {
    douyin: "抖音",
    xiaohongshu: "小红书",
    bilibili: "B站",
    weibo: "微博",
  };
  return map[platform] ?? platform;
}

function cycleWindow<T>(items: T[], start: number, size: number) {
  if (items.length === 0) return [];
  const count = Math.min(size, items.length);
  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]);
}

function topicRows(topTopics: Awaited<ReturnType<typeof getCreatorTopTopics>>) {
  return topTopics.slice(0, 5).map((topic) => {
    const heat = Math.round(topic.heatScore);
    return {
      rank: topic.rank,
      topic: topic.topic,
      stage: topic.stage,
      heat: `${heat}分`,
      match: `${Math.min(98, Math.max(70, heat))}%`,
      competition: heat >= 85 ? "高" : heat >= 55 ? "中" : "低",
      difficulty: heat >= 80 ? "高" : heat >= 50 ? "中" : "低",
      platforms: topic.platforms.length > 0 ? topic.platforms.map(platformLabel) : ["抖音"],
      advice: topic.advice,
    };
  });
}

function watchPool(rows: ReturnType<typeof topicRows>) {
  return rows.slice(0, 4).map((row) => ({
    topic: row.topic,
    status: row.stage === "爆发中" ? "升温中" : row.stage === "谨慎追" ? "已过热" : "观察中",
    action: row.stage === "爆发中" ? "可转草稿" : row.stage === "谨慎追" ? "暂缓" : "继续观察",
    signal: `${row.heat} / 匹配 ${row.match}`,
  }));
}

function draftPool(recommendations: RecommendationSummary[]) {
  return recommendations.slice(0, 3).map((item) => ({
    title: item.title,
    angle: item.tags[0] ? `${item.tags[0]}切入` : "热点切入",
    platforms: item.platform ? [platformLabel(item.platform)] : item.tags.slice(1, 3).map(platformLabel),
    reason: item.reason,
    status: Number.parseInt(item.heat, 10) >= 60 ? "可创作" : "待完善",
  }));
}

function caseStudy(contents: Awaited<ReturnType<typeof prisma.insightContent.findMany>>) {
  const topCase = contents[0];
  if (!topCase) return null;
  return {
    title: topCase.title,
    coverImageUrl: extractCoverImageUrl(topCase.rawPayload),
    likes: `${topCase.likeCount.toLocaleString()}赞`,
    stats: [topCase.likeCount, topCase.commentCount, topCase.collectCount, topCase.shareCount].map((value) => value.toLocaleString()),
    rows: [
      ["平台", platformLabel(topCase.platform)],
      ["关键词", topCase.keyword ?? "未标注"],
      ["作者", topCase.authorName ?? "未知作者"],
      ["互动结构", `赞 ${topCase.likeCount.toLocaleString()} / 评 ${topCase.commentCount.toLocaleString()} / 藏 ${topCase.collectCount.toLocaleString()}`],
      ["可复用模板", "热点内容拆解模板"],
    ],
  };
}

export async function generateCreatorTrendDailySnapshotPayload(batchCount: number, direction: string) {
  const terms = getInsightDirectionTerms(direction);
  const [overview, topTopics, trendSeries, analysis, contents, comments, settings] = await Promise.all([
    getCreatorTrendsOverview(direction),
    getCreatorTopTopics(direction),
    getCreatorTrendSeries(7, direction),
    getCreatorInsightAnalysis(direction),
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: Math.max(batchCount * 8, 24),
    }),
    prisma.insightComment.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: 400,
    }),
    prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
    }),
  ]);
  const scopedContents = contents.filter((content) =>
    matchesDirectionText(
      `${content.title} ${content.description ?? ""} ${content.keyword ?? ""} ${JSON.stringify(content.rawPayload ?? {})}`,
      terms,
    ),
  );

  const commentCountByContentId = new Map<string, number>();
  const commentTextsByContentId = new Map<string, string[]>();
  const scopedContentIds = new Set(scopedContents.map((content) => content.id));
  for (const comment of comments) {
    if (!scopedContentIds.has(comment.contentId) && !matchesDirectionText(comment.text, terms)) continue;
    commentCountByContentId.set(comment.contentId, (commentCountByContentId.get(comment.contentId) ?? 0) + 1);
    const texts = commentTextsByContentId.get(comment.contentId) ?? [];
    texts.push(comment.text);
    commentTextsByContentId.set(comment.contentId, texts);
  }

  const recommendationSourceContents = scopedContents.length > 3 ? scopedContents.slice(1) : scopedContents;
  const recommendationBatches = await Promise.all(Array.from({ length: batchCount }, async (_, index) => {
    const batchContents = cycleWindow(recommendationSourceContents, index * 4, 4);
    const baseBatch = deriveContentRecommendations(batchContents, commentCountByContentId, commentTextsByContentId);
    return rewriteRecommendationsWithAi(baseBatch, commentTextsByContentId, settings);
  }));
  const nonEmptyRecommendationBatches = recommendationBatches.filter((batch) => batch.length > 0);
  const rows = topicRows(topTopics);

  return {
    overview: overview.trackableTopics > 0 ? overview : analysis.overview,
    trendSeries,
    topicRows: rows,
    recommendationBatches: nonEmptyRecommendationBatches,
    caseStudy: {
      ...(caseStudy(scopedContents) ?? {}),
      watchPool: watchPool(rows),
      draftPool: draftPool(nonEmptyRecommendationBatches[0] ?? []),
    },
  };
}

export async function refreshCreatorTrendDailySnapshots(options: { now?: Date; force?: boolean } = {}) {
  const now = options.now ?? new Date();
  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });

  if (!settings.creatorTrendRefreshEnabled) {
    await prisma.platformSettings.update({
      where: { id: "platform" },
      data: {
        creatorTrendRefreshLastRunAt: now,
        creatorTrendRefreshLastStatus: "SKIPPED",
        creatorTrendRefreshLastError: null,
      },
    });
    return { skipped: true, directions: [] as string[], snapshots: 0 };
  }

  const date = creatorTrendSnapshotDate(now);
  const lastRunDate = settings.creatorTrendRefreshLastRunAt ? creatorTrendSnapshotDate(settings.creatorTrendRefreshLastRunAt) : null;
  if (!options.force && now.getUTCHours() !== settings.creatorTrendRefreshHourUtc) {
    return { skipped: true, reason: "not_due", directions: [] as string[], snapshots: 0 };
  }
  if (!options.force && settings.creatorTrendRefreshLastStatus === "SUCCESS" && lastRunDate?.getTime() === date.getTime()) {
    return { skipped: true, reason: "already_ran_today", directions: [] as string[], snapshots: 0 };
  }

  const configuredDirections = settings.creatorTrendRefreshDirections.filter(isInsightDirectionSlug);
  const directions = configuredDirections.length > 0 ? configuredDirections : [DEFAULT_INSIGHT_DIRECTION];
  const batchCount = Math.min(8, Math.max(1, settings.creatorTrendRefreshBatchCount));

  try {
    for (const direction of directions) {
      const payload = await generateCreatorTrendDailySnapshotPayload(batchCount, direction);
      await prisma.creatorTrendDailySnapshot.upsert({
        where: { date_direction: { date, direction } },
        update: {
          overview: jsonInput(payload.overview),
          trendSeries: jsonInput(payload.trendSeries),
          topicRows: jsonInput(payload.topicRows),
          recommendationBatches: jsonInput(payload.recommendationBatches),
          caseStudy: payload.caseStudy ? jsonInput(payload.caseStudy) : Prisma.JsonNull,
          generatedAt: now,
        },
        create: {
          date,
          direction,
          overview: jsonInput(payload.overview),
          trendSeries: jsonInput(payload.trendSeries),
          topicRows: jsonInput(payload.topicRows),
          recommendationBatches: jsonInput(payload.recommendationBatches),
          caseStudy: payload.caseStudy ? jsonInput(payload.caseStudy) : Prisma.JsonNull,
          generatedAt: now,
        },
      });
    }

    await prisma.platformSettings.update({
      where: { id: "platform" },
      data: {
        creatorTrendRefreshLastRunAt: now,
        creatorTrendRefreshLastStatus: "SUCCESS",
        creatorTrendRefreshLastError: null,
      },
    });

    return { skipped: false, directions, snapshots: directions.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.platformSettings.update({
      where: { id: "platform" },
      data: {
        creatorTrendRefreshLastRunAt: now,
        creatorTrendRefreshLastStatus: "FAILED",
        creatorTrendRefreshLastError: message.slice(0, 1000),
      },
    });
    throw error;
  }
}

export function defaultCreatorTrendDirections() {
  return INSIGHT_DIRECTIONS.map((direction) => direction.slug);
}
