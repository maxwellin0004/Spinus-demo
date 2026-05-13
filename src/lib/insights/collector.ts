import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeCommentText } from "@/lib/insights/analysis";
import { endpointFromConfig, getDueInsightKeywordConfigs } from "@/lib/insights/keywords";
import { normalizeScore, trendStage } from "@/lib/insights/scoring";
import { upsertKeywordTrendSnapshot } from "@/lib/insights/snapshots";
import { TikHubError, hasTikHubConfig, tikhubRequest } from "@/lib/tikhub/client";
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

function normalizedText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

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

    const requestOptions = input.endpoint === "xiaohongshuCreatorHotInspiration" ? { query: { cursor: "" } } : undefined;
    const payload = await (async () => {
      try {
        return await tikhubRequest<unknown>(TIKHUB_ENDPOINTS[input.endpoint], requestOptions);
      } catch (error) {
        const canFallback = input.endpoint === "xiaohongshuTrending" && error instanceof TikHubError && error.status === 400;
        if (!canFallback) throw error;
        // Some TikHub accounts cannot access `web_v3/fetch_trending`; fallback to `web_v2/fetch_hot_list`.
        return tikhubRequest<unknown>(TIKHUB_ENDPOINTS.xiaohongshuHotList);
      }
    })();
    const mapped = mapHotTopics(payload, input.platform).map((item, index, rows) => ({
      ...item,
      heatValue: item.heatValue > 0 ? item.heatValue : Math.max(1, rows.length - index),
    }));
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
    const settings = await prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
    });

    const requestOptions =
      input.endpoint === "xiaohongshuSearchNotes"
        ? {
            query: {
              keyword: input.keyword,
              page: 1,
              sort_type: "general",
              note_type: "不限",
              time_filter: "不限",
              search_id: "",
              search_session_id: "",
              source: "explore_feed",
              ai_mode: 0,
            },
          }
        : {
            body: {
              keyword: input.keyword,
              cursor: 0,
              sort_type: "0",
              publish_time: "0",
              filter_duration: "0",
              content_type: "0",
              search_id: "",
              backtrace: "",
            },
          };
    let mapped = [] as ReturnType<typeof mapSearchContents>;
    try {
      const payload = await tikhubRequest<unknown>(TIKHUB_ENDPOINTS[input.endpoint], requestOptions);
      mapped = mapSearchContents(payload, input.platform).slice(0, input.limit ?? 20);
    } catch (error) {
      const allowFallback =
        input.platform === "xiaohongshu" &&
        input.endpoint === "xiaohongshuSearchNotes" &&
        (error instanceof TikHubError ? [400, 422].includes(error.status) : true);
      if (!allowFallback) throw error;

      // Fallback: creator inspiration feed still returns usable note-like payloads.
      const fallbackPayload = await tikhubRequest<unknown>(TIKHUB_ENDPOINTS.xiaohongshuCreatorHotInspiration, {
        query: { cursor: "" },
      });
      const fallbackMapped = mapSearchContents(fallbackPayload, input.platform);
      const keywordText = normalizedText(input.keyword);
      const strictMatches = fallbackMapped.filter((item) => normalizedText(`${item.title} ${item.description ?? ""}`).includes(keywordText));
      mapped = (strictMatches.length > 0 ? strictMatches : fallbackMapped).slice(0, input.limit ?? 20);
    }

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
    const commentTargets = mapped.slice(0, Math.max(0, settings.insightCommentTargetCount));
    for (const item of commentTargets) {
      await collectCommentsForContent(item.sourceContentId, input.platform, settings.insightCommentPerContentLimit);
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
  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });
  const batchLimit = Math.max(1, Math.min(limit, settings.insightConfiguredCollectionBatchLimit));
  const configs = await getDueInsightKeywordConfigs(batchLimit);
  const results: Array<{
    configId: string;
    keyword: string;
    keywordType: string;
    runId?: string;
    resultCount: number;
    error?: string;
  }> = [];

  for (const config of configs) {
    const now = new Date();
    try {
      const result = await collectSearchContents({
        endpoint: endpointFromConfig(config.endpoint),
        platform: config.platform,
        keyword: config.keyword,
        limit: config.perRunLimit,
      });
      const retryDelayHours =
        result.resultCount > 0 ? config.collectIntervalHours : Math.min(config.collectIntervalHours, settings.insightZeroResultCooldownHours);
      // Backdate zero-result runs so the scheduler retries sooner without changing the config's steady-state interval.
      const effectiveLastCollectedAt = new Date(now.getTime() - Math.max(0, config.collectIntervalHours - retryDelayHours) * 60 * 60 * 1000);
      await prisma.insightKeywordConfig.update({
        where: { id: config.id },
        data: { lastCollectedAt: effectiveLastCollectedAt },
      });
      results.push({ configId: config.id, keyword: config.keyword, keywordType: config.keywordType, ...result });
    } catch (error) {
      // On failures, schedule a quicker retry.
      const retryDelayHours = Math.min(config.collectIntervalHours, settings.insightZeroResultCooldownHours);
      const effectiveLastCollectedAt = new Date(now.getTime() - Math.max(0, config.collectIntervalHours - retryDelayHours) * 60 * 60 * 1000);
      await prisma.insightKeywordConfig.update({
        where: { id: config.id },
        data: { lastCollectedAt: effectiveLastCollectedAt },
      });
      results.push({
        configId: config.id,
        keyword: config.keyword,
        keywordType: config.keywordType,
        resultCount: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    keywordCount: configs.length,
    resultCount: results.reduce((sum, item) => sum + item.resultCount, 0),
    runs: results,
  };
}
