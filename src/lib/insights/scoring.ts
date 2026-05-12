export type EngagementMetrics = {
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  collectCount?: number | null;
  viewCount?: number | null;
};

export function heatScore(metrics: EngagementMetrics) {
  return Math.round(
    (metrics.likeCount ?? 0) * 1 +
      (metrics.commentCount ?? 0) * 3 +
      (metrics.collectCount ?? 0) * 4 +
      (metrics.shareCount ?? 0) * 5 +
      (metrics.viewCount ?? 0) * 0.01,
  );
}

export function growthRate(current: number, previous: number) {
  if (previous <= 0 && current > 0) return 1;
  if (previous <= 0) return 0;
  return (current - previous) / previous;
}

export function trendStage(rate: number) {
  if (rate >= 0.5) return "爆发中";
  if (rate >= 0.15) return "刚升温";
  if (rate >= -0.15) return "长尾可做";
  return "已过热";
}

export function normalizeScore(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}
