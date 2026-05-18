import { CrawlerSnapshotStatus, Prisma } from "@prisma/client";

export type CrawlerFailureCategory =
  | "AUTH_REQUIRED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "NETWORK"
  | "PARSER"
  | "PROVIDER_ERROR"
  | "UNKNOWN";

export type CrawlerDataConfidence = "HIGH" | "MEDIUM" | "LOW" | "FAILED" | "UNKNOWN";

function normalized(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function categorizeCrawlerFailure(errorCode?: string | null, errorMessage?: string | null): CrawlerFailureCategory {
  const text = `${normalized(errorCode)} ${normalized(errorMessage)}`;
  if (!text.trim()) return "UNKNOWN";
  if (/login|auth|cookie|token|unauthori[sz]ed|forbidden|captcha|verify/.test(text)) return "AUTH_REQUIRED";
  if (/rate|limit|too many|429|频率|限流|too frequent/.test(text)) return "RATE_LIMITED";
  if (/not found|404|deleted|missing|不存在|已删除/.test(text)) return "NOT_FOUND";
  if (/timeout|network|econn|socket|dns|fetch failed|连接|超时/.test(text)) return "NETWORK";
  if (/parse|parser|schema|mapping|invalid payload|字段|解析/.test(text)) return "PARSER";
  if (/provider|upstream|5\d\d|bad gateway|service unavailable|服务/.test(text)) return "PROVIDER_ERROR";
  return "UNKNOWN";
}

export function evaluateCrawlerDataConfidence({
  status,
  failureCategory,
  hasRawEvidence,
  hasCoreMetric,
  authorMatched,
}: {
  status: CrawlerSnapshotStatus;
  failureCategory?: string | null;
  hasRawEvidence: boolean;
  hasCoreMetric: boolean;
  authorMatched?: boolean;
}): CrawlerDataConfidence {
  if (status === CrawlerSnapshotStatus.FAILED) return "FAILED";
  if (!hasCoreMetric) return "LOW";
  if (failureCategory) return "LOW";
  if (authorMatched === false) return "LOW";
  if (hasRawEvidence) return "HIGH";
  return "MEDIUM";
}

export function toJsonEvidence(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
