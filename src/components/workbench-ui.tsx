"use client";

import * as Tabs from "@radix-ui/react-tabs";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WorkbenchButton({
  children,
  className,
  tone = "default",
  size = "md",
  disabled,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  const tones = {
    default: "border-slate-200 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50",
    primary: "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    ghost: "border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border font-black transition disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs",
        tones[tone],
        className,
      )}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function WorkbenchStatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const tones = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
    neutral: "border-slate-200 bg-white text-slate-500",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black", tones[tone])}>{children}</span>;
}

export function WorkbenchProgress({ value, total }: { value: number; total: number }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="min-w-0">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
      </div>
      <p className="mt-1 text-[11px] font-black text-slate-400">
        {value}/{total} 已完成
      </p>
    </div>
  );
}

export function WorkbenchTabs({
  value,
  onValueChange,
  tabs,
}: {
  value: string;
  onValueChange: (value: string) => void;
  tabs: Array<{ value: string; label: ReactNode; content: ReactNode }>;
}) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange}>
      <Tabs.List className="grid grid-cols-4 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            className="rounded-md px-2 py-2 text-xs font-black text-slate-500 transition data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
            value={tab.value}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.value} className="mt-3 outline-none" value={tab.value}>
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

export function WorkbenchTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="z-[80] max-w-64 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold leading-5 text-white shadow-xl" sideOffset={6}>
            {label}
            <Tooltip.Arrow className="fill-slate-950" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function WorkbenchEmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
      <p className="text-sm font-black text-slate-950">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-sm text-xs font-semibold leading-5 text-slate-500">{body}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
