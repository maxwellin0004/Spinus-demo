import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { cacheTraceHeaders, withInsightCacheTrace } from "@/lib/insights/cache";
import { getBrandInsightAnalysis } from "@/lib/insights/analysis-queries";

function resolveDays(range: string | null, daysParam: string | null) {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  if (range === "30d") return 30;
  const parsed = Number.parseInt(daysParam ?? "", 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 90)) : 30;
}

export async function GET(request: Request) {
  const timer = withRouteTimer();
  await requireRole(UserRole.BRAND);
  const url = new URL(request.url);
  const direction = url.searchParams.get("direction") ?? undefined;
  const platform = url.searchParams.get("platform") ?? undefined;
  const keyword = url.searchParams.get("keyword") ?? undefined;
  const days = resolveDays(url.searchParams.get("range"), url.searchParams.get("days"));
  const { value: payload, trace } = await withInsightCacheTrace(() =>
    getBrandInsightAnalysis({ directionSlug: direction, platform, keyword, days }),
  );
  return timedJson(payload, {
    headers: cacheTraceHeaders(trace),
    metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "brand-insights-analysis" }],
  });
}
