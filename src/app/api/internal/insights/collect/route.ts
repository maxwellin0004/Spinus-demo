import { collectConfiguredKeywords, collectHotTopics, collectKeywordBatch, collectSearchContents, verifyInsightsToken } from "@/lib/insights/collector";
import { invalidateInsightReadCaches, scheduleInsightPrewarm } from "@/lib/insights/cache-maintenance";
import { seedDefaultInsightKeywords } from "@/lib/insights/keywords";
import { rebuildTrendSnapshotsFromContents } from "@/lib/insights/snapshots";
import { TIKHUB_ENDPOINTS, type TikHubEndpointKey } from "@/lib/tikhub/endpoints";

type CollectRequest = {
  type?: "hot_topics" | "search_contents" | "keyword_batch" | "configured_keywords" | "seed_keywords" | "rebuild_snapshots";
  endpoint?: TikHubEndpointKey;
  platform?: string;
  keyword?: string;
  keywords?: string[];
  limit?: number;
  prewarm?: boolean;
  directions?: string[];
};

function json(payload: unknown, status = 200) {
  return Response.json(payload, { status });
}

function isEndpoint(value: unknown): value is TikHubEndpointKey {
  return typeof value === "string" && value in TIKHUB_ENDPOINTS;
}

async function withCacheRefresh<T extends object>(
  payload: T,
  options?: { prewarm?: boolean; directions?: string[]; platforms?: string[]; maxDirections?: number },
) {
  const invalidation = await invalidateInsightReadCaches();
  const prewarmJob = options?.prewarm
    ? scheduleInsightPrewarm({
        directions: options.directions,
        platforms: options.platforms,
        maxDirections: options.maxDirections,
      })
    : null;

  return {
    ...payload,
    cache: {
      invalidation,
      prewarmJob,
    },
  };
}

export async function POST(request: Request) {
  if (!verifyInsightsToken(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = (await request.json().catch(() => null)) as CollectRequest | null;
  if (body?.type === "rebuild_snapshots") {
    const result = await rebuildTrendSnapshotsFromContents();
    return json(
      await withCacheRefresh(
        { ok: true, ...result },
        { prewarm: body.prewarm !== false, directions: body.directions, maxDirections: 2 },
      ),
    );
  }

  if (body?.type === "seed_keywords") {
    const result = await seedDefaultInsightKeywords();
    return json({ ok: true, ...result });
  }

  if (body?.type === "configured_keywords") {
    const result = await collectConfiguredKeywords(body.limit);
    return json(
        await withCacheRefresh(
          { ok: true, ...result },
          {
            prewarm: body.prewarm !== false,
            directions: body.directions,
            maxDirections: 3,
          },
      ),
    );
  }

  if (!body?.type || !isEndpoint(body.endpoint) || !body.platform) {
    return json({ error: "type, endpoint, and platform are required." }, 400);
  }

  try {
    if (body.type === "hot_topics") {
      const result = await collectHotTopics({ endpoint: body.endpoint, platform: body.platform });
      return json(
        await withCacheRefresh(
          { ok: true, ...result },
          {
            prewarm: body.prewarm !== false,
            directions: body.directions,
            platforms: [body.platform],
            maxDirections: 2,
          },
        ),
      );
    }

    if (body.type === "keyword_batch") {
      if (!Array.isArray(body.keywords) || body.keywords.length === 0) {
        return json({ error: "keywords is required for keyword_batch." }, 400);
      }
      const result = await collectKeywordBatch({
        endpoint: body.endpoint,
        platform: body.platform,
        keywords: body.keywords,
        limit: body.limit,
      });
      return json(
        await withCacheRefresh(
          { ok: true, ...result },
          {
            prewarm: body.prewarm !== false,
            directions: body.directions,
            platforms: [body.platform],
            maxDirections: 2,
          },
        ),
      );
    }

    if (!body.keyword?.trim()) {
      return json({ error: "keyword is required for search_contents." }, 400);
    }

    const result = await collectSearchContents({
      endpoint: body.endpoint,
      platform: body.platform,
      keyword: body.keyword.trim(),
      limit: body.limit,
    });
    return json(
      await withCacheRefresh(
        { ok: true, ...result },
        {
          prewarm: body.prewarm !== false,
          directions: body.directions,
          platforms: [body.platform],
          maxDirections: 2,
        },
      ),
    );
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
}
