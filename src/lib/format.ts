export function money(value: number | string | { toString(): string } | null | undefined, currency = "CNY") {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function number(value: number | null | undefined) {
  return new Intl.NumberFormat("zh-CN").format(value ?? 0);
}

export function crawlerMetric(value: number | null | undefined, metric: "views" | "likes" | "saves" | "comments" | "shares", provider?: string | null) {
  if (metric === "views" && value === 0 && provider === "justoneapi") return "接口未返回";
  if (value == null) return "未获取";
  return number(value);
}

export function percent(value: number | string | { toString(): string } | null | undefined) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export function shortDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function csv(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
