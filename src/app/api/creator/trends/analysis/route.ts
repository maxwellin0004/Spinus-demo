import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { cacheTraceHeaders, withInsightCacheTrace } from "@/lib/insights/cache";
import { getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";

export async function GET(request: Request) {
  const timer = withRouteTimer();
  await requireRole(UserRole.CREATOR);
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") ?? undefined;
  const { value: payload, trace } = await withInsightCacheTrace(() => getCreatorInsightAnalysis(direction));
  return timedJson(payload, {
    headers: cacheTraceHeaders(trace),
    metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trends-analysis" }],
  });
}
