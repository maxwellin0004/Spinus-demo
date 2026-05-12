import { prisma } from "@/lib/prisma";

function since(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function getCreatorTrendsOverview() {
  const [recentTopics, recentContents] = await Promise.all([
    prisma.insightTopic.findMany({
      where: { date: { gte: since(7) } },
      orderBy: { heatScore: "desc" },
      take: 50,
    }),
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: { heatScore: "desc" },
      take: 50,
    }),
  ]);

  return {
    trackableTopics: recentTopics.length,
    matchOpportunities: recentTopics.filter((item) => item.heatScore >= 70).length,
    highPotential: recentContents.filter((item) => item.heatScore >= 50).length,
    overheated: recentTopics.filter((item) => item.stage === "已过热").length,
  };
}

export async function getCreatorTopTopics() {
  const topics = await prisma.insightTopic.findMany({
    where: { date: { gte: since(7) } },
    orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
    take: 10,
  });

  return topics.map((topic, index) => ({
    rank: index + 1,
    topic: topic.topic,
    stage: topic.stage ?? "长尾可做",
    heatScore: topic.heatScore,
    growthRate: topic.growthRate ?? 0,
    platforms: topic.platforms,
    advice: topic.heatScore >= 70 ? "立即跟" : topic.heatScore >= 45 ? "可长尾" : "谨慎跟",
  }));
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

export async function getKeywordTrendSeries(days = 30) {
  const snapshots = await prisma.insightTrendSnapshot.findMany({
    where: { date: { gte: since(days) } },
    orderBy: [{ date: "asc" }, { heatScore: "desc" }],
  });

  const keywords = Array.from(new Set(snapshots.map((snapshot) => snapshot.keyword))).slice(0, 4);
  if (keywords.length === 0) return [];

  const rows = new Map<string, { date: string; brand: number; category: number; competitor: number; sellingPoint: number }>();
  const keys = ["brand", "category", "competitor", "sellingPoint"] as const;

  for (const snapshot of snapshots) {
    const label = formatDateLabel(snapshot.date);
    const row = rows.get(label) ?? { date: label, brand: 0, category: 0, competitor: 0, sellingPoint: 0 };
    const keywordIndex = keywords.indexOf(snapshot.keyword);
    const field = keys[keywordIndex] ?? "sellingPoint";
    row[field] += metricValue(snapshot.interactionCount, snapshot.contentCount, snapshot.heatScore);
    rows.set(label, row);
  }

  return Array.from(rows.values());
}

export async function getCreatorTrendSeries(days = 7) {
  const rows = await getKeywordTrendSeries(days);
  return rows.map((row) => ({
    date: row.date,
    skincare: row.brand,
    makeup: row.category,
    ingredients: row.competitor,
    tools: row.sellingPoint,
  }));
}
