import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { verifyInsightsToken } from "@/lib/insights/collector";
import { getInsightCacheStatsSnapshot, resetInsightCacheStats } from "@/lib/insights/cache";

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

  const stats = getInsightCacheStatsSnapshot();
  return timedJson(
    {
      ok: true,
      ...stats,
    },
    {
      metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "internal-insights-cache-stats" }],
    },
  );
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  if (!verifyInsightsToken(request)) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => null)) as { reset?: boolean } | null;
  if (body?.reset === false) {
    return timedJson(
      { ok: true, reset: false, ...getInsightCacheStatsSnapshot() },
      {
        metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "internal-insights-cache-stats" }],
      },
    );
  }

  resetInsightCacheStats();
  return timedJson(
    {
      ok: true,
      reset: true,
      ...getInsightCacheStatsSnapshot(),
    },
    {
      metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "internal-insights-cache-stats-reset" }],
    },
  );
}
