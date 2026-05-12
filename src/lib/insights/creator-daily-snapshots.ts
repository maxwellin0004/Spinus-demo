import { Prisma } from "@prisma/client";
import { deriveContentRecommendations } from "@/lib/insights/analysis";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTIONS, isInsightDirectionSlug } from "@/lib/insights/directions";
import { getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";
import { getCreatorTopTopics, getCreatorTrendSeries, getCreatorTrendsOverview } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";

function since(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
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

function caseStudy(contents: Awaited<ReturnType<typeof prisma.insightContent.findMany>>) {
  const topCase = contents[0];
  if (!topCase) return null;
  return {
    title: topCase.title,
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

export async function generateCreatorTrendDailySnapshotPayload(batchCount: number) {
  const [overview, topTopics, trendSeries, analysis, contents, comments] = await Promise.all([
    getCreatorTrendsOverview(),
    getCreatorTopTopics(),
    getCreatorTrendSeries(7),
    getCreatorInsightAnalysis(),
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: Math.max(batchCount * 4, 12),
    }),
    prisma.insightComment.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const commentCountByContentId = new Map<string, number>();
  for (const comment of comments) {
    commentCountByContentId.set(comment.contentId, (commentCountByContentId.get(comment.contentId) ?? 0) + 1);
  }

  const recommendationBatches = Array.from({ length: batchCount }, (_, index) => {
    const batchContents = cycleWindow(contents, index * 4, 4);
    return deriveContentRecommendations(batchContents, commentCountByContentId);
  }).filter((batch) => batch.length > 0);

  return {
    overview: overview.trackableTopics > 0 ? overview : analysis.overview,
    trendSeries,
    topicRows: topicRows(topTopics),
    recommendationBatches,
    caseStudy: caseStudy(contents),
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
      const payload = await generateCreatorTrendDailySnapshotPayload(batchCount);
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
