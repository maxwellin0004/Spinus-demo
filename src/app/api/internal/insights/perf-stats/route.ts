import { getRoutePerfSnapshot, resetRoutePerfStats, timedJson, withRouteTimer } from "@/lib/http-timing";
import { getInsightCacheStatsSnapshot, resetInsightCacheStats } from "@/lib/insights/cache";
import { getInsightPrewarmJobs } from "@/lib/insights/cache-maintenance";
import { verifyInsightsToken } from "@/lib/insights/collector";

function unauthorized() {
  return timedJson(
    { error: "Unauthorized" },
    {
      status: 401,
    },
  );
}

export async function GET(request: Request) {
  const timer = withRouteTimer();
  if (!verifyInsightsToken(request)) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number.parseInt(url.searchParams.get("limit") ?? "40", 10) || 40));
  const prewarmLimit = Math.max(1, Math.min(30, Number.parseInt(url.searchParams.get("prewarmLimit") ?? "20", 10) || 20));

  return timedJson(
    {
      ok: true,
      routePerf: getRoutePerfSnapshot(limit),
      cache: getInsightCacheStatsSnapshot(),
      prewarmJobs: getInsightPrewarmJobs(prewarmLimit),
    },
    {
      metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "internal-insights-perf-stats" }],
    },
  );
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  if (!verifyInsightsToken(request)) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => null)) as { resetRoute?: boolean; resetCache?: boolean } | null;
  const resetRoute = body?.resetRoute !== false;
  const resetCache = body?.resetCache === true;

  if (resetRoute) resetRoutePerfStats();
  if (resetCache) resetInsightCacheStats();

  return timedJson(
    {
      ok: true,
      resetRoute,
      resetCache,
      routePerf: getRoutePerfSnapshot(40),
      cache: getInsightCacheStatsSnapshot(),
      prewarmJobs: getInsightPrewarmJobs(20),
    },
    {
      metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "internal-insights-perf-stats-reset" }],
    },
  );
}
