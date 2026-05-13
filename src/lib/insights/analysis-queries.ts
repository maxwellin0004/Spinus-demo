import { deriveContentRecommendations, deriveTopicAdvice, summarizeCommentSignals } from "@/lib/insights/analysis";
import { getInsightDirectionTerms } from "@/lib/insights/directions";
import { rewriteRecommendationsWithAi } from "@/lib/insights/recommendation-ai";
import { prisma } from "@/lib/prisma";

function since(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function matchesDirectionText(text: string, terms: string[]) {
  if (terms.length === 0) return true;
  return terms.some((term) => text.includes(term));
}

export async function getBrandInsightAnalysis() {
  const [contents, comments, settings] = await Promise.all([
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
    prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
    }),
  ]);

  const summary = summarizeCommentSignals(comments);
  const commentCountByContentId = new Map<string, number>();
  const commentTextsByContentId = new Map<string, string[]>();
  for (const comment of comments) {
    commentCountByContentId.set(comment.contentId, (commentCountByContentId.get(comment.contentId) ?? 0) + 1);
    const texts = commentTextsByContentId.get(comment.contentId) ?? [];
    texts.push(comment.text);
    commentTextsByContentId.set(comment.contentId, texts);
  }

  const recommendationTargets = contents.filter((content) => content.heatScore >= 35).slice(0, 4);
  const baseRecommendations = deriveContentRecommendations(recommendationTargets, commentCountByContentId, commentTextsByContentId);
  const recommendations = await rewriteRecommendationsWithAi(baseRecommendations, commentTextsByContentId, settings);

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

export async function getCreatorInsightAnalysis(directionSlug?: string) {
  const terms = getInsightDirectionTerms(directionSlug);
  const [topics, contents, comments, settings] = await Promise.all([
    prisma.insightTopic.findMany({
      where: { date: { gte: since(7) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 240,
    }),
    prisma.insightContent.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 400,
    }),
    prisma.insightComment.findMany({
      where: { createdAt: { gte: since(7) } },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: 800,
    }),
    prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
    }),
  ]);

  const scopedTopics = topics
    .filter((topic) => matchesDirectionText(`${topic.topic} ${topic.category ?? ""} ${JSON.stringify(topic.rawPayload ?? {})}`, terms))
    .slice(0, 10);
  const scopedContents = contents
    .filter((content) =>
      matchesDirectionText(
        `${content.title} ${content.description ?? ""} ${content.keyword ?? ""} ${JSON.stringify(content.rawPayload ?? {})}`,
        terms,
      ),
    )
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
}
