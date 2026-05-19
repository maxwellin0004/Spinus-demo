"use client";

import type { ReactNode } from "react";
import { Card, MetricCard, StatusBadge, type StatusTone } from "@/components/ui";
import { cn } from "@/lib/utils";

export type AdminMetricItem = {
  label: string;
  value: ReactNode;
  sub?: string;
};

export function AdminMetricGrid({
  items,
  className,
  columns = "md:grid-cols-3",
}: {
  items: AdminMetricItem[];
  className?: string;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-4", columns, className)}>
      {items.map((item) => (
        <MetricCard key={item.label} label={item.label} value={item.value} sub={item.sub} compact />
      ))}
    </div>
  );
}

export function AdminInfoPanel({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-200 bg-amber-50/70 text-amber-900"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
        : "border-stone-200 bg-white/82 text-stone-600";

  return (
    <Card className={cn("border", toneClass)}>
      <div className="grid gap-3 text-sm leading-6">{children}</div>
    </Card>
  );
}

export function AdminNotice({
  children,
  tone = "success",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "info";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "info"
          ? "border-sky-200 bg-sky-50 text-sky-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return <div className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", toneClass)}>{children}</div>;
}

export function AdminSectionIntro({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description: ReactNode;
  badge?: { tone?: StatusTone; label: string };
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-black text-stone-950">{title}</h2>
          {badge ? <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge> : null}
        </div>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
