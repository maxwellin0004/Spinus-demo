import { prisma } from "@/lib/prisma";
import { getInsightDirectionTerms } from "@/lib/insights/directions";
import { withSharedInsightCache } from "@/lib/insights/cache";

const INSIGHTS_CACHE_MAX = 400;

async function withInsightsCache<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
  return withSharedInsightCache({
    namespace: "insights-queries",
    key,
    ttlMs,
    maxEntries: INSIGHTS_CACHE_MAX,
    loader,
  });
}

export type InsightScopedFilters = {
  directionSlug?: string;
  platform?: string;
  keyword?: string;
  days?: number;
};

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

function topicMatchesScope(
  topic: { topic: string; category?: string | null },
  terms: string[],
  keyword?: string,
) {
  const text = `${topic.topic} ${topic.category ?? ""}`;
  return matchesDirectionText(text, terms) && matchesKeywordText(text, keyword);
}

function contentMatchesScope(
  content: { title: string; description?: string | null; keyword?: string | null },
  terms: string[],
  keyword?: string,
) {
  const text = `${content.title} ${content.description ?? ""} ${content.keyword ?? ""}`;
  return matchesDirectionText(text, terms) && matchesKeywordText(text, keyword);
}

export async function getCreatorTrendsOverview(directionSlug?: string) {
  return withInsightsCache(`creator-overview:${directionSlug ?? "all"}`, 60_000, async () => {
  const terms = getInsightDirectionTerms(directionSlug);
  const [recentTopics, recentContents] = await Promise.all([
    prisma.insightTopic.findMany({
      where: { date: { gte: since(7) } },
      orderBy: { heatScore: "desc" },
      take: 320,
    }),
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: { heatScore: "desc" },
      take: 320,
    }),
  ]);

  const scopedTopics = recentTopics.filter((item) => topicMatchesScope(item, terms)).slice(0, 50);
  const scopedContents = recentContents.filter((item) => contentMatchesScope(item, terms)).slice(0, 50);
  const keywordTopicCount = new Set(scopedContents.map((item) => item.keyword).filter(Boolean)).size;
  const topicMatchCount = scopedTopics.filter((item) => item.heatScore >= 70).length;
  const contentMatchCount = scopedContents.filter((item) => item.heatScore >= 70).length;
  const topicOverheatedCount = scopedTopics.filter((item) => item.stage === "已过热").length;
  const contentOverheatedCount = scopedContents.filter((item) => item.heatScore >= 85).length;

  return {
    trackableTopics: Math.max(scopedTopics.length, keywordTopicCount),
    matchOpportunities: Math.max(topicMatchCount, contentMatchCount),
    highPotential: scopedContents.filter((item) => item.heatScore >= 50).length,
    overheated: Math.max(topicOverheatedCount, contentOverheatedCount),
  };
  });
}

export async function getCreatorTopTopics(directionSlug?: string) {
  return withInsightsCache(`creator-topics:${directionSlug ?? "all"}`, 60_000, async () => {
  const terms = getInsightDirectionTerms(directionSlug);
  const topics = (await prisma.insightTopic.findMany({
    where: { date: { gte: since(7) } },
    orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
    take: 180,
  }))
    .filter((topic) => topicMatchesScope(topic, terms))
    .slice(0, 10);

  const rankedTopicRows = topics.map((topic, index) => ({
    rank: index + 1,
    topic: topic.topic,
    stage: topic.stage ?? "长尾可做",
    heatScore: topic.heatScore,
    growthRate: topic.growthRate ?? 0,
    platforms: topic.platforms,
    advice: topic.heatScore >= 70 ? "立即跟进" : topic.heatScore >= 45 ? "可长期做" : "谨慎跟进",
  }));
  if (rankedTopicRows.length >= 10) {
    return rankedTopicRows;
  }

  const groupedContents = await prisma.insightContent.groupBy({
    by: ["keyword", "platform"],
    where: {
      keyword: { not: null },
      createdAt: { gte: since(7) },
    },
    _count: { _all: true },
    _avg: { heatScore: true },
    _sum: {
      likeCount: true,
      commentCount: true,
      shareCount: true,
      collectCount: true,
    },
  });

  const merged = new Map<
    string,
    {
      topic: string;
      platforms: Set<string>;
      avgHeatScore: number;
      contentCount: number;
      interactionCount: number;
    }
  >();

  for (const row of groupedContents) {
    if (!row.keyword || !matchesDirectionText(row.keyword, terms)) continue;
    const existing = merged.get(row.keyword) ?? {
      topic: row.keyword,
      platforms: new Set<string>(),
      avgHeatScore: 0,
      contentCount: 0,
      interactionCount: 0,
    };
    existing.platforms.add(row.platform);
    existing.avgHeatScore = Math.max(existing.avgHeatScore, row._avg.heatScore ?? 0);
    existing.contentCount += row._count._all ?? 0;
    existing.interactionCount +=
      (row._sum.likeCount ?? 0) +
      (row._sum.commentCount ?? 0) +
      (row._sum.shareCount ?? 0) +
      (row._sum.collectCount ?? 0);
    merged.set(row.keyword, existing);
  }

  const fallbackRows = Array.from(merged.values())
    .map((row) => {
      const interactionBoost = row.interactionCount > 0 ? Math.log10(row.interactionCount + 1) * 8 : 0;
      const contentBoost = row.contentCount > 0 ? Math.log10(row.contentCount + 1) * 6 : 0;
      const heatScore = Math.min(100, Math.round((row.avgHeatScore || 0) + interactionBoost + contentBoost));
      return {
        topic: row.topic,
        heatScore,
        platforms: Array.from(row.platforms),
      };
    })
    .sort((a, b) => b.heatScore - a.heatScore)
    .filter((row) => !rankedTopicRows.some((topic) => topic.topic === row.topic))
    .slice(0, Math.max(0, 10 - rankedTopicRows.length))
    .map((row, index) => ({
      rank: rankedTopicRows.length + index + 1,
      topic: row.topic,
      stage: row.heatScore >= 85 ? "爆发中" : row.heatScore >= 55 ? "长尾可做" : "谨慎跟进",
      heatScore: row.heatScore,
      growthRate: 0,
      platforms: row.platforms,
      advice: row.heatScore >= 70 ? "立即跟进" : row.heatScore >= 45 ? "可长期做" : "谨慎跟进",
    }));
  return [...rankedTopicRows, ...fallbackRows];
  });
}

function opportunityLevel(value: number) {
  if (value >= 80) return "高";
  if (value >= 55) return "中";
  return "低";
}

function xiaohongshuMatchScore(input: {
  heatScore: number;
  contentCount: number;
  interactionCount: number;
  collectCount: number;
  commentCount: number;
}) {
  const searchHeat = Math.min(100, Math.round(input.heatScore));
  const noteFit = Math.min(100, 56 + input.collectCount * 2 + input.commentCount * 3);
  const titleCover = Math.min(100, 58 + Math.round(input.interactionCount / 80));
  const accountFit = Math.min(96, Math.max(68, Math.round(searchHeat * 0.74 + noteFit * 0.26)));
  const competitionPenalty = Math.min(18, Math.max(0, input.contentCount - 6) * 2);
  return Math.max(45, Math.min(98, Math.round(searchHeat * 0.25 + noteFit * 0.2 + titleCover * 0.2 + accountFit * 0.2 + (100 - competitionPenalty * 4) * 0.15)));
}

export async function getXiaohongshuOpportunityRows(directionSlug?: string) {
  return withInsightsCache(`creator-xhs:${directionSlug ?? "all"}`, 60_000, async () => {
  const terms = getInsightDirectionTerms(directionSlug);
  const [topics, groupedContents] = await Promise.all([
    prisma.insightTopic.findMany({
      where: {
        source: "tikhub:xiaohongshu",
        date: { gte: since(7) },
      },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 60,
    }),
    prisma.insightContent.groupBy({
      by: ["keyword"],
      where: {
        platform: "xiaohongshu",
        keyword: { not: null },
        createdAt: { gte: since(14) },
      },
      _count: { _all: true },
      _sum: {
        likeCount: true,
        commentCount: true,
        shareCount: true,
        collectCount: true,
      },
      orderBy: { _sum: { collectCount: "desc" } },
      take: 120,
    }),
  ]);

  const scopedTopics = topics.filter((topic) => topicMatchesScope(topic, terms));
  const scopedGroupedContents = groupedContents.filter((row) => row.keyword && matchesDirectionText(row.keyword, terms));
  const contentByKeyword = new Map(scopedGroupedContents.map((row) => [row.keyword, row]));

  const topicRows = scopedTopics.map((topic) => {
    const content = contentByKeyword.get(topic.topic);
    const interactionCount =
      (content?._sum.likeCount ?? 0) +
      (content?._sum.commentCount ?? 0) +
      (content?._sum.shareCount ?? 0) +
      (content?._sum.collectCount ?? 0);
    const contentCount = content?._count._all ?? 0;
    const matchScore = xiaohongshuMatchScore({
      heatScore: topic.heatScore,
      contentCount,
      interactionCount,
      collectCount: content?._sum.collectCount ?? 0,
      commentCount: content?._sum.commentCount ?? 0,
    });

    return {
      topic: topic.topic,
      source: topic.source.includes("Creator") ? "创作灵感" : "热搜热榜",
      heat: Math.round(topic.heatScore),
      match: matchScore,
      noteFit: opportunityLevel(matchScore),
      titlePotential: opportunityLevel(Math.min(100, topic.heatScore + Math.round(interactionCount / 120))),
      competition: contentCount >= 12 ? "高" : contentCount >= 5 ? "中" : "低",
      action: matchScore >= 82 ? "立即写" : matchScore >= 68 ? "观察补样本" : "暂缓",
    };
  });

  const contentOnlyRows = scopedGroupedContents
    .filter((row) => row.keyword && !scopedTopics.some((topic) => topic.topic === row.keyword))
    .slice(0, Math.max(0, 8 - topicRows.length))
    .map((row) => {
      const interactionCount = (row._sum.likeCount ?? 0) + (row._sum.commentCount ?? 0) + (row._sum.shareCount ?? 0) + (row._sum.collectCount ?? 0);
      const heat = Math.min(100, Math.round(interactionCount / Math.max(1, row._count._all * 50)));
      const match = xiaohongshuMatchScore({
        heatScore: heat,
        contentCount: row._count._all,
        interactionCount,
        collectCount: row._sum.collectCount ?? 0,
        commentCount: row._sum.commentCount ?? 0,
      });
      return {
        topic: row.keyword ?? "未标记关键词",
        source: "笔记样本",
        heat,
        match,
        noteFit: opportunityLevel(match),
        titlePotential: opportunityLevel(Math.min(100, heat + Math.round(interactionCount / 120))),
        competition: row._count._all >= 12 ? "高" : row._count._all >= 5 ? "中" : "低",
        action: match >= 82 ? "立即写" : match >= 68 ? "观察补样本" : "暂缓",
      };
    });

  return [...topicRows, ...contentOnlyRows]
    .sort((a, b) => b.match - a.match)
    .slice(0, 8)
    .map((row, index) => ({ rank: index + 1, ...row }));
  });
}

export async function getBrandInsightsOverview(filters?: InsightScopedFilters) {
  const cacheKey = JSON.stringify({
    direction: filters?.directionSlug ?? "all",
    platform: filters?.platform ?? "all",
    keyword: filters?.keyword?.trim() ?? "",
    days: filters?.days ?? 30,
  });
  return withInsightsCache(`brand-overview:${cacheKey}`, 60_000, async () => {
  const scoped = normalizeScopedFilters(filters, 30);
  const baseWhere = {
    createdAt: { gte: since(scoped.days) },
    ...(scoped.platform ? { platform: scoped.platform } : {}),
  };

  const contents = await prisma.insightContent.findMany({
    where: baseWhere,
    select: {
      id: true,
      title: true,
      description: true,
      keyword: true,
      rawPayload: true,
      likeCount: true,
      commentCount: true,
      shareCount: true,
      collectCount: true,
    },
    orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
    take: 600,
  });
  const scopedContents = contents.filter((item) => contentMatchesScope(item, scoped.terms, scoped.keyword));
  const scopedContentIds = scopedContents.map((item) => item.id);

  const comments = scopedContentIds.length
    ? await prisma.insightComment.findMany({
        where: {
          createdAt: { gte: since(scoped.days) },
          contentId: { in: scopedContentIds },
        },
        select: { sentiment: true },
        take: 800,
      })
    : [];

  const voiceCount = scopedContents.length;
  const interactionCount = scopedContents.reduce((sum, item) => sum + item.likeCount + item.commentCount + item.shareCount + item.collectCount, 0);
  const positive = comments.filter((item) => item.sentiment === "正面").length;
  const negative = comments.filter((item) => item.sentiment === "负面").length;
  const sentimentBase = positive + negative || comments.length || 1;

  return {
    voiceCount,
    interactionCount,
    positiveRate: comments.length > 0 ? positive / sentimentBase : 0,
    negativeAlerts: negative,
  };
  });
}

export async function getBrandCompetitors(filters?: InsightScopedFilters) {
  const cacheKey = JSON.stringify({
    direction: filters?.directionSlug ?? "all",
    platform: filters?.platform ?? "all",
    keyword: filters?.keyword?.trim() ?? "",
    days: filters?.days ?? 30,
  });
  return withInsightsCache(`brand-competitors:${cacheKey}`, 60_000, async () => {
  const scoped = normalizeScopedFilters(filters, 30);
  const contents = await prisma.insightContent.findMany({
    where: {
      createdAt: { gte: since(scoped.days) },
      ...(scoped.platform ? { platform: scoped.platform } : {}),
    },
    select: {
      keyword: true,
      title: true,
      description: true,
      rawPayload: true,
      likeCount: true,
      commentCount: true,
      shareCount: true,
      collectCount: true,
    },
    orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
    take: 900,
  });

  const map = new Map<
    string,
    {
      voiceCount: number;
      interactions: number;
    }
  >();
  for (const content of contents) {
    if (!content.keyword) continue;
    if (!contentMatchesScope(content, scoped.terms, scoped.keyword)) continue;
    const row = map.get(content.keyword) ?? { voiceCount: 0, interactions: 0 };
    row.voiceCount += 1;
    row.interactions += content.likeCount + content.commentCount + content.shareCount + content.collectCount;
    map.set(content.keyword, row);
  }

  return Array.from(map.entries())
    .map(([keyword, value]) => ({
      keyword,
      voiceCount: value.voiceCount,
      interactions: value.interactions,
    }))
    .sort((a, b) => {
      if (b.voiceCount !== a.voiceCount) return b.voiceCount - a.voiceCount;
      return b.interactions - a.interactions;
    })
    .slice(0, 10)
    .map((row, index) => ({
      rank: index + 1,
      ...row,
    }));
  });
}

export async function getBrandRecentContents(filters?: InsightScopedFilters, take = 100) {
  const cacheKey = JSON.stringify({
    direction: filters?.directionSlug ?? "all",
    platform: filters?.platform ?? "all",
    keyword: filters?.keyword?.trim() ?? "",
    days: filters?.days ?? 30,
    take,
  });
  return withInsightsCache(`brand-contents:${cacheKey}`, 60_000, async () => {
  const scoped = normalizeScopedFilters(filters, 30);
  const contents = await prisma.insightContent.findMany({
    where: {
      createdAt: { gte: since(scoped.days) },
      ...(scoped.platform ? { platform: scoped.platform } : {}),
    },
    select: {
      id: true,
      platform: true,
      title: true,
      description: true,
      keyword: true,
      rawPayload: true,
      heatScore: true,
      updatedAt: true,
    },
    orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
    take: Math.max(1, Math.min(2000, take)),
  });
  return contents.filter((item) => contentMatchesScope(item, scoped.terms, scoped.keyword));
  });
}

function formatDateLabel(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function metricValue(interactions: number, contentCount: number, heatScore: number) {
  return Math.max(Math.round(interactions / 100), Math.round(contentCount * 8), Math.round(heatScore));
}

export async function getKeywordTrendSeries(
  days = 30,
  directionSlug?: string,
  options?: { platform?: string; keyword?: string },
) {
  const cacheKey = JSON.stringify({
    days: Math.max(1, Math.min(90, Math.trunc(days))),
    directionSlug: directionSlug ?? "all",
    platform: options?.platform ?? "all",
    keyword: options?.keyword?.trim() ?? "",
  });
  return withInsightsCache(`trend-series:${cacheKey}`, 90_000, async () => {
  const terms = getInsightDirectionTerms(directionSlug);
  const platform = options?.platform && options.platform !== "all" ? options.platform : undefined;
  const keyword = options?.keyword?.trim() || undefined;
  const pointCount = Math.max(1, Math.min(90, Math.trunc(days)));
  const rangeEnd = startOfDay(new Date());
  const rangeStart = addDays(rangeEnd, -pointCount + 1);

  const snapshots = await prisma.insightTrendSnapshot.findMany({
    where: {
      date: { gte: rangeStart },
      ...(platform ? { platform } : {}),
    },
    orderBy: [{ date: "asc" }, { heatScore: "desc" }],
  });

  const scopedSnapshots = snapshots.filter((snapshot) => {
    const text = `${snapshot.keyword} ${snapshot.keywordType ?? ""}`;
    return matchesDirectionText(text, terms) && matchesKeywordText(text, keyword);
  });
  const keywords = Array.from(new Set(scopedSnapshots.map((snapshot) => snapshot.keyword))).slice(0, 4);
  if (keywords.length === 0) return [];

  const rows = new Map<string, { date: string; brand: number; category: number; competitor: number; sellingPoint: number; hasSnapshot: boolean }>();
  for (let i = 0; i < pointCount; i += 1) {
    const day = addDays(rangeStart, i);
    rows.set(dateKey(day), { date: formatDateLabel(day), brand: 0, category: 0, competitor: 0, sellingPoint: 0, hasSnapshot: false });
  }

  const keys = ["brand", "category", "competitor", "sellingPoint"] as const;

  for (const snapshot of scopedSnapshots) {
    const key = dateKey(snapshot.date);
    const row = rows.get(key);
    if (!row) continue;
    const keywordIndex = keywords.indexOf(snapshot.keyword);
    const field = keys[keywordIndex] ?? "sellingPoint";
    row[field] += metricValue(snapshot.interactionCount, snapshot.contentCount, snapshot.heatScore);
    row.hasSnapshot = true;
    rows.set(key, row);
  }

  const orderedRows = Array.from(rows.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => ({ ...value }));

  // Keep the timeline continuous: days without snapshots inherit the previous day's value.
  for (let i = 1; i < orderedRows.length; i += 1) {
    if (orderedRows[i].hasSnapshot) continue;
    orderedRows[i].brand = orderedRows[i - 1].brand;
    orderedRows[i].category = orderedRows[i - 1].category;
    orderedRows[i].competitor = orderedRows[i - 1].competitor;
    orderedRows[i].sellingPoint = orderedRows[i - 1].sellingPoint;
  }

  return orderedRows.map((row) => ({
    date: row.date,
    brand: row.brand,
    category: row.category,
    competitor: row.competitor,
    sellingPoint: row.sellingPoint,
  }));
  });
}

export async function getCreatorTrendSeries(days = 7, directionSlug?: string) {
  const rows = await getKeywordTrendSeries(days, directionSlug);
  return rows.map((row) => ({
    date: row.date,
    skincare: row.brand,
    makeup: row.category,
    ingredients: row.competitor,
    tools: row.sellingPoint,
  }));
}
