import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTIONS } from "@/lib/insights/directions";
import { completeCreatorTrendAiRecommendations } from "@/lib/insights/creator-trend-detail";

type CompleteBody = {
  direction?: unknown;
  platform?: unknown;
  keyword?: unknown;
};

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function normalizeDirection(value: unknown) {
  const direction = text(value, 80);
  return INSIGHT_DIRECTIONS.some((item) => item.slug === direction) ? direction : DEFAULT_INSIGHT_DIRECTION;
}

function normalizePlatform(value: unknown): "all" | "xiaohongshu" | "douyin" | "weibo" | "bilibili" {
  const platform = text(value, 40);
  return platform === "xiaohongshu" || platform === "douyin" || platform === "weibo" || platform === "bilibili" ? platform : "all";
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  await requireRole(UserRole.CREATOR);
  const body = (await request.json().catch(() => ({}))) as CompleteBody;
  const direction = normalizeDirection(body.direction);
  const platform = normalizePlatform(body.platform);
  const keyword = text(body.keyword, 120);

  const data = await completeCreatorTrendAiRecommendations({ direction, platform, keyword });

  return timedJson(
    { data },
    {
      metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-ai-recommendations-complete" }],
    },
  );
}
