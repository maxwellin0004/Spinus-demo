import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { zh, zhNode, zhText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "stitch-stage rounded-2xl border border-[var(--line)] bg-white/82 p-5 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  compact = false,
  href,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  compact?: boolean;
  href?: string;
}) {
  const content = (
    <Card className={cn("relative overflow-hidden bg-white/88", compact ? "min-h-24 p-4" : "min-h-32")}>
      <div className="relative flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        <p className="text-xs font-black uppercase tracking-[0.12em] text-stone-500">{zhText(label)}</p>
      </div>
      <div className={cn("relative font-black tracking-tight text-[var(--ink)]", compact ? "mt-3 text-2xl" : "mt-4 text-3xl")}>{value}</div>
      {sub ? <div className="relative mt-2 text-sm text-stone-500">{zhNode(sub)}</div> : null}
    </Card>
  );
  if (!href) return content;
  return (
    <Link className="block transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-amber-100" href={href}>
      {content}
    </Link>
  );
}

export type PostMetricsLike = {
  status?: string | null;
  viewCount?: number | null;
  likeCount?: number | null;
  favoriteCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  authorName?: string | null;
  authorPlatformUserId?: string | null;
  authorMatchStatus?: string | null;
  rawProvider?: string | null;
  failureReason?: string | null;
  fetchedAt?: Date | string | null;
};

function metricNumber(value: number | null | undefined) {
  if (value == null) return zhText("Not fetched");
  return new Intl.NumberFormat("zh-CN").format(value);
}

function metricValue(label: string, value: number | null | undefined, provider?: string | null) {
  if (label === "Views" && value === 0 && provider === "justoneapi") return zhText("Provider did not return");
  return metricNumber(value);
}

function metricDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PostMetricsPanel({
  snapshot,
  latestAttempt,
  compact = false,
}: {
  snapshot?: PostMetricsLike | null;
  latestAttempt?: PostMetricsLike | null;
  compact?: boolean;
}) {
  const source = snapshot?.rawProvider ?? latestAttempt?.rawProvider ?? "-";
  const fetchedAt = snapshot?.fetchedAt ?? latestAttempt?.fetchedAt;
  const status = latestAttempt?.status ?? snapshot?.status ?? "-";

  return (
    <div className="rounded-2xl border border-stone-200 bg-white/82 p-4 text-sm text-stone-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-stone-950">{zhText("Post metrics")}</p>
          <p className="mt-1 text-xs text-stone-500">
            {zhText("Provider")}: {source} · {zhText("Status")}: {zhText(status)} · {zhText("Fetched")}: {metricDate(fetchedAt)}
          </p>
        </div>
        {snapshot?.authorMatchStatus ? <StatusBadge>{snapshot.authorMatchStatus}</StatusBadge> : null}
      </div>
      <div className={cn("mt-4 grid gap-3", compact ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-5")}>
        {[
          ["Views", snapshot?.viewCount],
          ["Likes", snapshot?.likeCount],
          ["Saves", snapshot?.favoriteCount],
          ["Comments", snapshot?.commentCount],
          ["Shares", snapshot?.shareCount],
        ].map(([label, value]) => (
          <div className="rounded-2xl bg-stone-50 p-3" key={String(label)}>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-stone-500">{zhText(String(label))}</p>
            <p className="mt-1 text-lg font-black text-stone-950">{metricValue(String(label), value as number | null | undefined, snapshot?.rawProvider)}</p>
          </div>
        ))}
      </div>
      {!compact ? (
        <div className="mt-4 grid gap-2 text-xs text-stone-600 md:grid-cols-2">
          <p>{zhText("Author")}: {snapshot?.authorName ?? "-"}</p>
          <p>{zhText("Author ID")}: {snapshot?.authorPlatformUserId ?? "-"}</p>
          {latestAttempt?.failureReason ? <p className="md:col-span-2 text-amber-700">{latestAttempt.failureReason}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center">
      <p className="text-base font-black text-stone-900">{zhText(title)}</p>
      {body ? <p className="mt-2 text-sm text-stone-500">{zhText(body)}</p> : null}
    </div>
  );
}

function statusText(value: ReactNode) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function statusTone(value: ReactNode) {
  const text = statusText(value).toUpperCase();
  if (
    text.includes("APPROVED") ||
    text.includes("VERIFIED") ||
    text.includes("SETTLED") ||
    text.includes("SUCCESS") ||
    text.includes("PAID") ||
    text.includes("ACTIVE") ||
    text.includes("VALID") ||
    text.includes("MATCHED") ||
    text.includes("通过") ||
    text.includes("成功") ||
    text.includes("已验收") ||
    text.includes("已结算") ||
    text.includes("已入账") ||
    text.includes("在线") ||
    text.includes("启用")
  ) {
    return "success";
  }
  if (
    text.includes("PENDING") ||
    text.includes("APPLIED") ||
    text.includes("SUBMITTED") ||
    text.includes("AWAITING") ||
    text.includes("PROCESSING") ||
    text.includes("DRAFT") ||
    text.includes("待") ||
    text.includes("审核") ||
    text.includes("处理中") ||
    text.includes("未读")
  ) {
    return "warning";
  }
  if (
    text.includes("REJECTED") ||
    text.includes("FAILED") ||
    text.includes("FROZEN") ||
    text.includes("EXPIRED") ||
    text.includes("MISMATCHED") ||
    text.includes("CANCELLED") ||
    text.includes("拒绝") ||
    text.includes("失败") ||
    text.includes("冻结") ||
    text.includes("异常") ||
    text.includes("超") ||
    text.includes("离线") ||
    text.includes("停用")
  ) {
    return "danger";
  }
  if (
    text.includes("PAUSED") ||
    text.includes("ARCHIVED") ||
    text.includes("UNKNOWN") ||
    text.includes("未知") ||
    text.includes("暂停") ||
    text.includes("归档")
  ) {
    return "neutral";
  }
  return "default";
}

export function StatusBadge({ children }: { children: ReactNode }) {
  const tone = statusTone(children);
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-700",
    neutral: "border-stone-200 bg-stone-100 text-stone-600",
    default: "border-stone-200 bg-white/80 text-stone-700",
  };
  const dotStyles = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    neutral: "bg-stone-400",
    default: "bg-[var(--accent)]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] shadow-sm", styles[tone])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[tone])} />
      {zh(children)}
    </span>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {zhText(label)}
      <input
        className="rounded-xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder ? zhText(placeholder) : undefined}
      />
    </label>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  required,
  rows = 4,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {zhText(label)}
      <textarea
        className="rounded-xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={rows}
        placeholder={placeholder ? zhText(placeholder) : undefined}
      />
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {zhText(label)}
      <select
        className="rounded-xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
        name={name}
        defaultValue={defaultValue}
      >
        {zhNode(children)}
      </select>
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  type = "submit",
  name,
  value,
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  type?: "submit" | "button";
  name?: string;
  value?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  const styles = {
    primary: "bg-[var(--ink)] text-white shadow-sm hover:bg-stone-800",
    secondary: "bg-[var(--accent)] text-stone-950 shadow-sm hover:bg-amber-300",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-500",
    ghost: "border border-stone-200 bg-white/80 text-stone-800 hover:bg-white",
  };
  return (
    <button
      className={cn("rounded-xl px-4 py-2.5 text-sm font-black transition active:translate-y-px", styles[variant], className)}
      type={type}
      name={name}
      value={value}
      onClick={onClick}
    >
      {zh(children)}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary: "bg-[var(--ink)] text-white shadow-sm hover:bg-stone-800",
    secondary: "bg-[var(--accent)] text-stone-950 shadow-sm hover:bg-amber-300",
    ghost: "border border-stone-200 bg-white/80 text-stone-800 hover:bg-white",
  };
  return (
    <Link className={cn("rounded-xl px-4 py-2.5 text-sm font-black transition active:translate-y-px", styles[variant])} href={href}>
      {zh(children)}
    </Link>
  );
}

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{zhText(eyebrow)}</p> : null}
        <h1 className="mt-2 max-w-5xl text-3xl font-black tracking-tight text-[var(--ink)] md:text-4xl">{zhText(title)}</h1>
      </div>
      {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  if (rows.length === 0) {
    return <EmptyState title="No records yet" body="Records will appear here when the workflow starts." />;
  }
  return (
    <div>
      <div className="grid gap-3 md:hidden">
        {rows.map((row, rowIndex) => (
          <article className="rounded-2xl border border-[var(--line)] bg-white/86 p-4 shadow-sm" key={rowIndex}>
            <div className="grid gap-3">
              {row.map((cell, cellIndex) => (
                <div className={cellIndex === 0 ? "border-b border-stone-100 pb-3" : "grid grid-cols-[7rem_1fr] gap-3"} key={cellIndex}>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-stone-400">{zhText(headers[cellIndex] ?? "")}</p>
                  <div className={cn("min-w-0 text-sm text-stone-700", cellIndex === 0 ? "mt-1 font-black text-stone-950" : "text-right")}>{zhNode(cell)}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-[var(--line)] bg-white/86 shadow-sm backdrop-blur-sm md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-[0.1em] text-stone-500">
            <tr>
              {headers.map((header) => (
                <th className="px-4 py-3 font-semibold" key={header}>
                  {zhText(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row, rowIndex) => (
              <tr className="align-top transition hover:bg-amber-50/35" key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-4 text-stone-700" key={cellIndex}>
                    {zhNode(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
