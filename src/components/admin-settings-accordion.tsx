"use client";

import { Children, isValidElement, type ReactNode, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, FoldVertical, UnfoldVertical } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/ui";
import { cn } from "@/lib/utils";

export type AdminSettingsAccordionSectionProps = {
  id: string;
  title: string;
  summary: string;
  tone?: StatusTone;
  abnormal?: boolean;
  children: ReactNode;
};

export function AdminSettingsAccordionSection({ children }: AdminSettingsAccordionSectionProps) {
  return <>{children}</>;
}

export function AdminSettingsAccordion({
  defaultExpandedId,
  children,
}: {
  defaultExpandedId?: string;
  children: ReactNode;
}) {
  const sections = useMemo(
    () =>
      Children.toArray(children).flatMap((child) => {
        if (!isValidElement<AdminSettingsAccordionSectionProps>(child)) return [];
        return [child.props];
      }),
    [children],
  );

  const initialExpandedId = defaultExpandedId ?? sections[0]?.id ?? null;
  const [expandedIds, setExpandedIds] = useState<string[]>(initialExpandedId ? [initialExpandedId] : []);
  const [onlyAbnormal, setOnlyAbnormal] = useState(false);

  const visibleSections = onlyAbnormal ? sections.filter((section) => section.abnormal) : sections;

  function toggleSection(id: string) {
    setExpandedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [id]));
  }

  function expandAll() {
    setExpandedIds(sections.map((section) => section.id));
  }

  function collapseAll() {
    setExpandedIds([]);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-stone-950">配置分组</p>
          <p className="mt-1 text-sm text-stone-500">默认仅展开首个分组。先看摘要，再决定进入哪一段编辑。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-700 transition hover:bg-stone-50"
            type="button"
            onClick={expandAll}
          >
            <UnfoldVertical className="h-4 w-4" />
            展开全部
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-700 transition hover:bg-stone-50"
            type="button"
            onClick={collapseAll}
          >
            <FoldVertical className="h-4 w-4" />
            收起全部
          </button>
          <button
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black transition",
              onlyAbnormal
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
            )}
            type="button"
            onClick={() => setOnlyAbnormal((current) => !current)}
          >
            <AlertTriangle className="h-4 w-4" />
            只看异常项
          </button>
        </div>
      </div>

      {visibleSections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/75 px-6 py-10 text-center shadow-sm">
          <p className="text-base font-black text-stone-950">当前没有异常项</p>
          <p className="mt-2 text-sm text-stone-500">关闭“只看异常项”可以查看全部配置分组。</p>
        </div>
      ) : null}

      {visibleSections.map((section) => {
        const expanded = expandedIds.includes(section.id);
        return (
          <section
            className={cn(
              "rounded-[28px] border bg-white/82 shadow-sm backdrop-blur-sm transition",
              expanded ? "border-[var(--line)]" : "border-stone-200",
            )}
            key={section.id}
          >
            <button
              aria-expanded={expanded}
              className="flex w-full flex-col gap-4 px-5 py-5 text-left md:flex-row md:items-start md:justify-between"
              type="button"
              onClick={() => toggleSection(section.id)}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-stone-950 md:text-xl">{section.title}</h2>
                  {section.abnormal ? <StatusBadge tone="warning">需处理</StatusBadge> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-500">{section.summary}</p>
              </div>
              <div className="flex items-center gap-3">
                {section.tone ? <StatusBadge tone={section.tone}>{section.abnormal ? "异常" : "正常"}</StatusBadge> : null}
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600">
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </div>
            </button>
            {expanded ? <div className="border-t border-stone-100 px-3 pb-3 pt-1">{section.children}</div> : null}
          </section>
        );
      })}
    </div>
  );
}
