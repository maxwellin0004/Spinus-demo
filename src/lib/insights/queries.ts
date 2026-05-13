import { prisma } from "@/lib/prisma";
import { getInsightDirectionTerms } from "@/lib/insights/directions";

function since(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function matchesDirectionText(text: string, terms: string[]) {
  if (terms.length === 0) return true;
  return terms.some((term) => text.includes(term));
}

function topicMatchesDirection(topic: { topic: string; category?: string | null; rawPayload?: unknown }, terms: string[]) {
  return matchesDirectionText(`${topic.topic} ${topic.category ?? ""} ${JSON.stringify(topic.rawPayload ?? {})}`, terms);
}

function contentMatchesDirection(content: { title: string; description?: string | null; keyword?: string | null; rawPayload?: unknown }, terms: string[]) {
  return matchesDirectionText(`${content.title} ${content.description ?? ""} ${content.keyword ?? ""} ${JSON.stringify(content.rawPayload ?? {})}`, terms);
}

export async function getCreatorTrendsOverview(directionSlug?: string) {
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

  const scopedTopics = recentTopics.filter((item) => topicMatchesDirection(item, terms)).slice(0, 50);
  const scopedContents = recentContents.filter((item) => contentMatchesDirection(item, terms)).slice(0, 50);
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
}

export async function getCreatorTopTopics(directionSlug?: string) {
  const terms = getInsightDirectionTerms(directionSlug);
  const topics = (await prisma.insightTopic.findMany({
    where: { date: { gte: since(7) } },
    orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
    take: 180,
  }))
    .filter((topic) => topicMatchesDirection(topic, terms))
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
      stage: row.heatScore >= 85 ? "爆发中" : row.heatScore >= 55 ? "长尾可做" : "谨慎追",
      heatScore: row.heatScore,
      growthRate: 0,
      platforms: row.platforms,
      advice: row.heatScore >= 70 ? "立即跟进" : row.heatScore >= 45 ? "可长期做" : "谨慎跟进",
    }));
  return [...rankedTopicRows, ...fallbackRows];
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

  const scopedTopics = topics.filter((topic) => topicMatchesDirection(topic, terms));
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
}

export async function getBrandInsightsOverview() {
  const [contents, comments] = await Promise.all([
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(30) } },
      take: 500,
    }),
    prisma.insightComment.findMany({
      where: { createdAt: { gte: since(30) } },
      take: 500,
    }),
  ]);

  const voiceCount = contents.length;
  const interactionCount = contents.reduce((sum, item) => sum + item.likeCount + item.commentCount + item.shareCount + item.collectCount, 0);
  const positive = comments.filter((item) => item.sentiment === "正面").length;
  const negative = comments.filter((item) => item.sentiment === "负面").length;
  const sentimentBase = positive + negative || comments.length || 1;

  return {
    voiceCount,
    interactionCount,
    positiveRate: positive / sentimentBase,
    negativeAlerts: negative,
  };
}

export async function getBrandCompetitors() {
  const rows = await prisma.insightContent.groupBy({
    by: ["keyword"],
    where: { keyword: { not: null }, createdAt: { gte: since(30) } },
    _count: { _all: true },
    _sum: {
      likeCount: true,
      commentCount: true,
      shareCount: true,
      collectCount: true,
    },
    orderBy: { _count: { keyword: "desc" } },
    take: 10,
  });

  return rows.map((row, index) => ({
    rank: index + 1,
    keyword: row.keyword,
    voiceCount: row._count._all,
    interactions: (row._sum.likeCount ?? 0) + (row._sum.commentCount ?? 0) + (row._sum.shareCount ?? 0) + (row._sum.collectCount ?? 0),
  }));
}

function formatDateLabel(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function metricValue(interactions: number, contentCount: number, heatScore: number) {
  return Math.max(Math.round(interactions / 100), Math.round(contentCount * 8), Math.round(heatScore));
}

export async function getKeywordTrendSeries(days = 30, directionSlug?: string) {
  const terms = getInsightDirectionTerms(directionSlug);
  const snapshots = await prisma.insightTrendSnapshot.findMany({
    where: { date: { gte: since(days) } },
    orderBy: [{ date: "asc" }, { heatScore: "desc" }],
  });

  const scopedSnapshots = snapshots.filter((snapshot) => matchesDirectionText(`${snapshot.keyword} ${snapshot.keywordType ?? ""} ${JSON.stringify(snapshot.rawPayload ?? {})}`, terms));
  const keywords = Array.from(new Set(scopedSnapshots.map((snapshot) => snapshot.keyword))).slice(0, 4);
  if (keywords.length === 0) return [];

  const rows = new Map<string, { date: string; brand: number; category: number; competitor: number; sellingPoint: number }>();
  const keys = ["brand", "category", "competitor", "sellingPoint"] as const;

  for (const snapshot of scopedSnapshots) {
    const label = formatDateLabel(snapshot.date);
    const row = rows.get(label) ?? { date: label, brand: 0, category: 0, competitor: 0, sellingPoint: 0 };
    const keywordIndex = keywords.indexOf(snapshot.keyword);
    const field = keys[keywordIndex] ?? "sellingPoint";
    row[field] += metricValue(snapshot.interactionCount, snapshot.contentCount, snapshot.heatScore);
    rows.set(label, row);
  }

  return Array.from(rows.values());
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
