export type InsightSourceKind = "真实采集" | "AI生成" | "规则计算" | "示例兜底";
export type InsightConfidence = "高可信" | "中可信" | "低可信" | "示例数据";

export type InsightCredibilityInput = {
  sourceKind?: InsightSourceKind;
  sampleCount?: number | null;
  commentSampleCount?: number | null;
  platformSourceCount?: number | null;
  updatedAt?: Date | string | null;
};

export function evaluateInsightConfidence(input: InsightCredibilityInput): InsightConfidence {
  if (input.sourceKind === "示例兜底") return "示例数据";

  const sampleCount = input.sampleCount ?? 0;
  const commentSampleCount = input.commentSampleCount ?? 0;
  const platformSourceCount = input.platformSourceCount ?? 0;

  if (sampleCount >= 50 && platformSourceCount >= 2) return "高可信";
  if (sampleCount >= 30 && commentSampleCount >= 20) return "高可信";
  if (sampleCount >= 12 || commentSampleCount >= 8) return "中可信";
  if (sampleCount > 0 || input.updatedAt) return "低可信";

  return "示例数据";
}

export function formatInsightUpdatedAt(value: Date | string | null | undefined) {
  if (!value) return "暂无更新时间";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无更新时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatInsightSampleText(input: InsightCredibilityInput) {
  const sampleCount = input.sampleCount ?? 0;
  const commentSampleCount = input.commentSampleCount ?? 0;
  const platformSourceCount = input.platformSourceCount ?? 0;
  const parts = [
    sampleCount > 0 ? `内容样本 ${sampleCount}` : null,
    commentSampleCount > 0 ? `评论样本 ${commentSampleCount}` : null,
    platformSourceCount > 0 ? `来源平台 ${platformSourceCount}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "样本待补充";
}

export function buildInsightReason(input: {
  topic: string;
  heatScore?: number | null;
  matchScore?: number | null;
  sampleCount?: number | null;
  commentSampleCount?: number | null;
  platformSourceCount?: number | null;
  source?: string | null;
}) {
  const heat = Math.round(input.heatScore ?? input.matchScore ?? 0);
  const sampleCount = input.sampleCount ?? 0;
  const commentSampleCount = input.commentSampleCount ?? 0;
  const platformSourceCount = input.platformSourceCount ?? 0;
  const evidence =
    sampleCount > 0
      ? `基于 ${sampleCount} 条内容样本${commentSampleCount > 0 ? `和 ${commentSampleCount} 条评论` : ""}${platformSourceCount > 1 ? `，覆盖 ${platformSourceCount} 个平台` : ""}`
      : "基于当前热度信号";
  const source = input.source ? `${input.source}显示` : "系统显示";
  const score = heat > 0 ? `，热度/匹配度约 ${heat} 分` : "";
  return `${source}${input.topic}${score}；${evidence}，适合用于判断是否跟进。`;
}
