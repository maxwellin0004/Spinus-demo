import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeCommentText } from "@/lib/insights/analysis";
import { endpointFromConfig, getDueInsightKeywordConfigs } from "@/lib/insights/keywords";
import { normalizeScore, trendStage } from "@/lib/insights/scoring";
import { upsertKeywordTrendSnapshot } from "@/lib/insights/snapshots";
import { hasTikHubConfig, tikhubRequest } from "@/lib/tikhub/client";
import { TIKHUB_ENDPOINTS, type TikHubEndpointKey } from "@/lib/tikhub/endpoints";
import { mapComments, mapHotTopics, mapSearchContents } from "@/lib/tikhub/mappers";

type CollectHotTopicsInput = {
  endpoint: TikHubEndpointKey;
  platform: string;
};

type CollectSearchInput = {
  endpoint: TikHubEndpointKey;
  platform: string;
  keyword: string;
  limit?: number;
};

type CollectKeywordBatchInput = {
  endpoint: TikHubEndpointKey;
  platform: string;
  keywords: string[];
  limit?: number;
};

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

async function collectCommentsForContent(contentId: string, platform: string, limit = 10) {
  if (platform !== "xiaohongshu") return 0;
  try {
    const payload = await tikhubRequest<unknown>(TIKHUB_ENDPOINTS.xiaohongshuNoteComments, {
      query: {
        note_id: contentId,
        count: limit,
        page: 1,
      },
    });
    const mapped = mapComments(payload).slice(0, limit);
    let inserted = 0;
    for (const comment of mapped) {
      const analysis = analyzeCommentText(comment.text);
      await prisma.insightComment.upsert({
        where: {
          platform_sourceCommentId_contentId: {
            platform,
            sourceCommentId: comment.sourceCommentId ?? `${contentId}:${inserted}`,
            contentId,
          },
        },
        update: {
          text: comment.text,
          likeCount: comment.likeCount,
          sentiment: analysis.sentiment,
          painPoint: analysis.painPoint ?? null,
          riskTag: analysis.riskTag ?? null,
          rawPayload: jsonInput(comment.rawPayload),
        },
        create: {
          platform,
          sourceCommentId: comment.sourceCommentId ?? `${contentId}:${inserted}`,
          contentId,
          text: comment.text,
          likeCount: comment.likeCount,
          sentiment: analysis.sentiment,
          painPoint: analysis.painPoint ?? null,
          riskTag: analysis.riskTag ?? null,
          rawPayload: jsonInput(comment.rawPayload),
        },
      });
      inserted += 1;
    }
    return inserted;
  } catch {
    return 0;
  }
}

export function verifyInsightsToken(request: Request) {
  const configured = process.env.INSIGHTS_INTERNAL_TOKEN?.trim();
  if (!configured) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  return token === configured;
}

export async function collectHotTopics(input: CollectHotTopicsInput) {
  const run = await prisma.insightCollectionRun.create({
    data: {
      source: "tikhub",
      platform: input.platform,
      jobType: "HOT_TOPICS",
      status: "PROCESSING",
      requestPayload: input,
    },
  });

  try {
    if (!hasTikHubConfig()) {
      throw new Error("TIKHUB_API_KEY is not configured.");
    }

    const payload = await tikhubRequest<unknown>(TIKHUB_ENDPOINTS[input.endpoint]);
    const mapped = mapHotTopics(payload, input.platform);
    const maxHeat = Math.max(...mapped.map((item) => item.heatValue), 0);
    const today = startOfDay();

    for (const item of mapped) {
      const heatScore = normalizeScore(item.heatValue, maxHeat);
      await prisma.insightTopic.upsert({
        where: {
          source_topic_date: {
            source: `tikhub:${input.platform}`,
            topic: item.topic,
            date: today,
          },
        },
        update: {
          sourceKey: item.sourceKey,
          platforms: item.platforms,
          heatValue: item.heatValue,
          heatScore,
          stage: trendStage(heatScore / 100),
          rawPayload: jsonInput(item.rawPayload),
        },
        create: {
          source: `tikhub:${input.platform}`,
          sourceKey: item.sourceKey,
          topic: item.topic,
          platforms: item.platforms,
          date: today,
          heatValue: item.heatValue,
          heatScore,
          stage: trendStage(heatScore / 100),
          rawPayload: jsonInput(item.rawPayload),
        },
      });
    }

    await prisma.insightCollectionRun.update({
      where: { id: run.id },
      data: { status: "SUCCESS", resultCount: mapped.length, completedAt: new Date() },
    });

    return { runId: run.id, resultCount: mapped.length };
  } catch (error) {
    await prisma.insightCollectionRun.update({
      where: { id: run.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : String(error), completedAt: new Date() },
    });
    throw error;
  }
}

export async function collectSearchContents(input: CollectSearchInput) {
  const run = await prisma.insightCollectionRun.create({
    data: {
      source: "tikhub",
      platform: input.platform,
      jobType: "SEARCH_CONTENTS",
      status: "PROCESSING",
      keyword: input.keyword,
      requestPayload: input,
    },
  });

  try {
    if (!hasTikHubConfig()) {
      throw new Error("TIKHUB_API_KEY is not configured.");
    }

    const query =
      input.endpoint === "xiaohongshuSearchNotes"
        ? {
            keyword: input.keyword,
            page: 1,
            sort_type: "general",
            note_type: 0,
            time_filter: 0,
            search_id: "",
            search_session_id: "",
            source: "explore_feed",
            ai_mode: 0,
          }
        : {
            keyword: input.keyword,
            keywords: input.keyword,
            query: input.keyword,
            page: 1,
            count: input.limit ?? 20,
          };
    const payload = await tikhubRequest<unknown>(TIKHUB_ENDPOINTS[input.endpoint], { query });
    const mapped = mapSearchContents(payload, input.platform).slice(0, input.limit ?? 20);

    for (const item of mapped) {
      await prisma.insightContent.upsert({
        where: {
          platform_sourceContentId: {
            platform: item.platform,
            sourceContentId: item.sourceContentId,
          },
        },
        update: {
          title: item.title,
          description: item.description,
          authorId: item.authorId,
          authorName: item.authorName,
          publishTime: item.publishTime,
          contentUrl: item.contentUrl,
          likeCount: item.likeCount,
          commentCount: item.commentCount,
          shareCount: item.shareCount,
          collectCount: item.collectCount,
          viewCount: item.viewCount,
          keyword: input.keyword,
          heatScore: item.heatScore,
          rawPayload: jsonInput(item.rawPayload),
        },
        create: {
          platform: item.platform,
          sourceContentId: item.sourceContentId,
          title: item.title,
          description: item.description,
          authorId: item.authorId,
          authorName: item.authorName,
          publishTime: item.publishTime,
          contentUrl: item.contentUrl,
          likeCount: item.likeCount,
          commentCount: item.commentCount,
          shareCount: item.shareCount,
          collectCount: item.collectCount,
          viewCount: item.viewCount,
          keyword: input.keyword,
          heatScore: item.heatScore,
          rawPayload: jsonInput(item.rawPayload),
        },
      });
    }
    const commentTargets = mapped.slice(0, 3);
    for (const item of commentTargets) {
      await collectCommentsForContent(item.sourceContentId, input.platform, 8);
    }
    await upsertKeywordTrendSnapshot({ platform: input.platform, keyword: input.keyword });

    await prisma.insightCollectionRun.update({
      where: { id: run.id },
      data: { status: "SUCCESS", resultCount: mapped.length, completedAt: new Date() },
    });

    return { runId: run.id, resultCount: mapped.length };
  } catch (error) {
    await prisma.insightCollectionRun.update({
      where: { id: run.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : String(error), completedAt: new Date() },
    });
    throw error;
  }
}

export async function collectKeywordBatch(input: CollectKeywordBatchInput) {
  const keywords = Array.from(new Set(input.keywords.map((keyword) => keyword.trim()).filter(Boolean)));
  const results = [];

  for (const keyword of keywords) {
    results.push(
      await collectSearchContents({
        endpoint: input.endpoint,
        platform: input.platform,
        keyword,
        limit: input.limit,
      }),
    );
  }

  return {
    keywordCount: keywords.length,
    resultCount: results.reduce((sum, item) => sum + item.resultCount, 0),
    runs: results,
  };
}

export async function collectConfiguredKeywords(limit = 20) {
  const configs = await getDueInsightKeywordConfigs(limit);
  const results = [];

  for (const config of configs) {
    const result = await collectSearchContents({
      endpoint: endpointFromConfig(config.endpoint),
      platform: config.platform,
      keyword: config.keyword,
      limit: config.perRunLimit,
    });
    await prisma.insightKeywordConfig.update({
      where: { id: config.id },
      data: { lastCollectedAt: new Date() },
    });
    results.push({ configId: config.id, keyword: config.keyword, keywordType: config.keywordType, ...result });
  }

  return {
    keywordCount: configs.length,
    resultCount: results.reduce((sum, item) => sum + item.resultCount, 0),
    runs: results,
  };
}
