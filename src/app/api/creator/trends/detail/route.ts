import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { cacheTraceHeaders, withInsightCacheTrace } from "@/lib/insights/cache";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTIONS } from "@/lib/insights/directions";
import { getCreatorTrendDetailData } from "@/lib/insights/creator-trend-detail";

function normalizeDirection(value: string | null) {
  if (!value) return DEFAULT_INSIGHT_DIRECTION;
  return INSIGHT_DIRECTIONS.some((item) => item.slug === value) ? value : DEFAULT_INSIGHT_DIRECTION;
}

function normalizePlatform(value: string | null): "all" | "xiaohongshu" | "douyin" | "weibo" | "bilibili" {
  return value === "xiaohongshu" || value === "douyin" || value === "weibo" || value === "bilibili" ? value : "all";
}

export async function GET(request: Request) {
  const timer = withRouteTimer();
  await requireRole(UserRole.CREATOR);
  const { searchParams } = new URL(request.url);
  const direction = normalizeDirection(searchParams.get("direction"));
  const platform = normalizePlatform(searchParams.get("platform"));
  const keyword = searchParams.get("keyword")?.trim() ?? "";
  const { value: payload, trace } = await withInsightCacheTrace(() => getCreatorTrendDetailData({ direction, platform, keyword }));
  return timedJson(payload, {
    headers: cacheTraceHeaders(trace),
    metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trends-detail" }],
  });
}
