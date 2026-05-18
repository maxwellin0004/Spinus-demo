import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { cacheTraceHeaders, withInsightCacheTrace } from "@/lib/insights/cache";
import { getCreatorTopTopics } from "@/lib/insights/queries";

function resolveDays(range: string | null, daysParam: string | null) {
  if (range === "24h") return 1;
  if (range === "30d") return 30;
  if (range === "7d") return 7;
  const parsed = Number.parseInt(daysParam ?? "", 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 90)) : 7;
}

export async function GET(request: Request) {
  const timer = withRouteTimer();
  await requireRole(UserRole.CREATOR);
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") ?? undefined;
  const platform = searchParams.get("platform") ?? undefined;
  const keyword = searchParams.get("keyword") ?? undefined;
  const scenario = searchParams.get("scenario") ?? undefined;
  const days = resolveDays(searchParams.get("range"), searchParams.get("days"));
  const { value: topics, trace } = await withInsightCacheTrace(() =>
    getCreatorTopTopics({ directionSlug: direction, platform, keyword, days, scenario }),
  );
  return timedJson(
    { topics },
    {
      headers: cacheTraceHeaders(trace),
      metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trends-topics" }],
    },
  );
}
