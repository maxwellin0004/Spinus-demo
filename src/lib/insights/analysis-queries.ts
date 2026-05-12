import { deriveContentRecommendations, deriveTopicAdvice, summarizeCommentSignals } from "@/lib/insights/analysis";
import { prisma } from "@/lib/prisma";

function since(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function getBrandInsightAnalysis() {
  const [contents, comments] = await Promise.all([
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(30) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 60,
    }),
    prisma.insightComment.findMany({
      where: { createdAt: { gte: since(30) } },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const summary = summarizeCommentSignals(comments);
  const commentCountByContentId = new Map<string, number>();
  for (const comment of comments) {
    commentCountByContentId.set(comment.contentId, (commentCountByContentId.get(comment.contentId) ?? 0) + 1);
  }

  const recommendationTargets = contents.filter((content) => content.heatScore >= 35).slice(0, 4);
  const recommendations = deriveContentRecommendations(recommendationTargets, commentCountByContentId);

  return {
    metrics: {
      voiceCount: contents.length,
      interactionCount: contents.reduce((sum, item) => sum + item.likeCount + item.commentCount + item.shareCount + item.collectCount, 0),
      positiveRate: summary.positiveRate,
      negativeAlerts: summary.totals.negative,
    },
    painPoints: summary.painPoints,
    risks: summary.risks,
    recommendations,
    comments: summary.comments,
  };
}

export async function getCreatorInsightAnalysis() {
  const [topics, contents, comments] = await Promise.all([
    prisma.insightTopic.findMany({
      where: { date: { gte: since(7) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 10,
    }),
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 20,
    }),
    prisma.insightComment.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
  ]);

  const summary = summarizeCommentSignals(comments);
  const topicsWithAdvice = topics.map((topic) => ({
    topic: topic.topic,
    ...deriveTopicAdvice(topic),
    heat: Math.round(topic.heatScore),
    platforms: topic.platforms,
    stage: topic.stage,
  }));

  return {
    overview: {
      trackableTopics: topics.length,
      matchOpportunities: topics.filter((topic) => topic.heatScore >= 70).length,
      highPotential: contents.filter((item) => item.heatScore >= 50).length,
      overheated: topics.filter((topic) => topic.stage === "已过热").length,
    },
    topics: topicsWithAdvice,
    comments: summary,
    recommendations: deriveContentRecommendations(contents, new Map(comments.map((comment) => [comment.contentId, 1]))),
  };
}
