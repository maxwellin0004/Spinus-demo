import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { cacheTraceHeaders, withInsightCacheTrace } from "@/lib/insights/cache";
import { getCreatorTrendsOverview } from "@/lib/insights/queries";

export async function GET(request: Request) {
  const timer = withRouteTimer();
  await requireRole(UserRole.CREATOR);
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") ?? undefined;
  const { value: payload, trace } = await withInsightCacheTrace(() => getCreatorTrendsOverview(direction));
  return timedJson(payload, {
    headers: cacheTraceHeaders(trace),
    metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trends-overview" }],
  });
}
