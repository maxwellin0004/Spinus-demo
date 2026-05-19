"use client";

import { CheckCircle2, ChevronDown, ChevronUp, Copy, ImageIcon, List, Loader2, Maximize2, Minimize2, RefreshCw, ShieldCheck, Table2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WorkbenchEmptyState, WorkbenchProgress, WorkbenchStatusBadge, WorkbenchTabs } from "@/components/workbench-ui";
import type { ScriptGenerationView, ScriptImageView, ScriptReviewView, ScriptTable, ScriptTableGroupKey } from "@/lib/insights/script-tables";
import { cn } from "@/lib/utils";

type TabKey = "case" | "graphic" | "video";
type TableVisibility = "primary" | "secondary" | "technical";

type Props = {
  record: ScriptGenerationView | null;
  pendingScript?: PendingScriptGeneration | null;
  open?: boolean;
  readOnly?: boolean;
  onClose?: () => void;
  onRegenerate?: (instruction: string) => void;
  onRecordUpdate?: (record: ScriptGenerationView) => void;
  regenerating?: boolean;
  allowTableRegenerate?: boolean;
};

export type PendingScriptGeneration = {
  sourceTitle: string;
  platformLabel: string;
  directionLabel: string;
  mode: "create" | "regenerate";
};

type ScriptTab = {
  key: TabKey;
  label: string;
  tables: ScriptTable[];
};

type TableRegenerateTarget = {
  groupKey: ScriptTableGroupKey;
  tableId: string;
};

type SummaryItem = {
  label: string;
  value: string;
  hint: string;
};

type ScriptImagePromptView = {
  pageKey: string;
  pageLabel: string;
  pageOrder: number;
  prompt: string;
  negativePrompt: string | null;
  aspectRatio: string | null;
  size: string;
  overlayText: string;
  promptHash: string;
};

function formatTime(value: string | null) {
  if (!value) return "尚未生成";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function tableText(tables: ScriptTable[]) {
  return tables
    .map((table) => {
      const rows = table.rows.map((row) => row.join("\t")).join("\n");
      return [`## ${table.title}`, table.columns.join("\t"), rows].join("\n");
    })
    .join("\n\n");
}

function tablesByTab(record: ScriptGenerationView | null): ScriptTab[] {
  if (!record) return [];
  return [
    record.caseAnalysisTables.length > 0 ? { key: "case" as const, label: "爆款拆解", tables: record.caseAnalysisTables } : null,
    record.graphicTables.length > 0 ? { key: "graphic" as const, label: "图文脚本", tables: record.graphicTables } : null,
    record.videoTables.length > 0 ? { key: "video" as const, label: "视频脚本", tables: record.videoTables } : null,
  ].filter((item): item is ScriptTab => Boolean(item));
}

function groupKeyForTab(tabKey: TabKey): ScriptTableGroupKey {
  if (tabKey === "case") return "caseAnalysisTables";
  if (tabKey === "graphic") return "graphicTables";
  return "videoTables";
}

function includesAny(value: string, keywords: string[]) {
  const source = value.toLowerCase();
  return keywords.some((keyword) => source.includes(keyword.toLowerCase()));
}

function tableSearchText(table: ScriptTable) {
  return `${table.id} ${table.title} ${table.columns.join(" ")}`.toLowerCase();
}

function isPromptColumn(column: string) {
  return /提示词|正向|负向|imagePrompt|negativePrompt|素材生成/i.test(column);
}

function tableVisibility(tabKey: TabKey, table: ScriptTable): TableVisibility {
  const text = tableSearchText(table);

  if (includesAny(text, ["remotion", "react", "debug", "ai debug", "原始", "校验", "timingstatus", "voiceid"])) {
    return "technical";
  }

  if (tabKey === "graphic") {
    if (includesAny(text, ["合规", "避坑", "风险"])) return "secondary";
    return "primary";
  }

  if (tabKey === "video") {
    if (includesAny(text, ["音频", "bgm", "音效", "动画", "转场", "合规", "风险"])) return "secondary";
    return "primary";
  }

  if (includesAny(text, ["基础信息", "证据等级", "逐镜头", "视觉", "布局", "图层", "动画", "特效", "字幕", "音频"])) {
    return "secondary";
  }

  return "primary";
}

function classifyTables(tabKey: TabKey, tables: ScriptTable[]) {
  const groups: Record<TableVisibility, ScriptTable[]> = {
    primary: [],
    secondary: [],
    technical: [],
  };

  for (const table of tables) {
    groups[tableVisibility(tabKey, table)].push(table);
  }

  if (groups.primary.length === 0) {
    groups.primary = groups.secondary.splice(0, Math.min(2, groups.secondary.length));
  }

  return groups;
}

function tableDomId(tabKey: TabKey, table: ScriptTable, index: number) {
  const stablePart = `${table.id || table.title || "table"}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `script-${tabKey}-${index}-${stablePart || "table"}`;
}

function findTable(tables: ScriptTable[], keywords: string[]) {
  return tables.find((table) => includesAny(`${table.id} ${table.title} ${table.columns.join(" ")}`, keywords));
}

function findRowValue(table: ScriptTable | undefined, keywords: string[], preferredColumnKeywords: string[] = []) {
  if (!table) return "";

  const row = table.rows.find((candidate) => includesAny(candidate.join(" "), keywords));
  if (!row) return "";

  if (preferredColumnKeywords.length > 0) {
    const preferredIndex = table.columns.findIndex((column) => includesAny(column, preferredColumnKeywords));
    if (preferredIndex > 0 && row[preferredIndex]?.trim()) return row[preferredIndex].trim();
  }

  return row.slice(1).find((cell) => cell.trim())?.trim() || row[0]?.trim() || "";
}

function fallbackValue(value: string, fallback: string) {
  return value.trim() || fallback;
}

function buildSummaryItems(record: ScriptGenerationView): SummaryItem[] {
  const strategyTable = findTable(record.graphicTables, ["策略", "选题", "objective"]);
  const coverTable = findTable(record.graphicTables, ["封面", "cover"]);
  const graphicPublishTable = findTable(record.graphicTables, ["发布", "互动", "cta"]);
  const videoStructureTable = findTable(record.videoTables, ["结构", "hook", "总览"]);
  const videoPublishTable = findTable(record.videoTables, ["发布", "cta", "互动"]);

  const title = findRowValue(strategyTable, ["选题标题", "改写标题", "标题"], ["内容", "具体内容", "页面文案"]);
  const pain = findRowValue(strategyTable, ["核心痛点", "痛点", "用户问题"], ["内容", "具体内容"]);
  const cover = findRowValue(coverTable, ["封面主标题", "封面文案", "主标题", "标题"], ["内容", "文案", "页面文案"]);
  const hook = findRowValue(videoStructureTable, ["hook", "开场", "钩子", "前 3 秒"], ["内容", "口播", "核心信息"]);
  const cta =
    findRowValue(videoPublishTable, ["cta", "评论", "互动", "行动"], ["内容", "文案", "话术"]) ||
    findRowValue(graphicPublishTable, ["cta", "评论", "互动", "行动"], ["内容", "文案", "话术"]);

  return [
    { label: "选题", value: fallbackValue(title, record.sourceTitle), hint: "最终标题方向" },
    { label: "核心痛点", value: fallbackValue(pain, "暂未提取到核心痛点，可在策略表查看完整信息。"), hint: "用户为什么会停留" },
    { label: "封面", value: fallbackValue(cover, "暂未提取到封面文案，可在封面包装表查看。"), hint: "图文第一眼信息" },
    { label: "视频 Hook", value: fallbackValue(hook, "暂未提取到视频开场，可在视频结构表查看。"), hint: "前 3 秒留人点" },
    { label: "CTA", value: fallbackValue(cta, "暂未提取到行动引导，可在发布包装表查看。"), hint: "评论或转化动作" },
  ];
}

function visibleDirectoryTables(groups: Record<TableVisibility, ScriptTable[]> | null, readOnly: boolean) {
  if (!groups) return [];
  return [...groups.primary, ...groups.secondary, ...(readOnly ? groups.technical : [])];
}

function scrollToTable(id: string) {
  document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" });
}

function ScriptSummaryCards({ items }: { items: SummaryItem[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">脚本摘要</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">先看可执行结论，再进入完整表格。</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <div key={item.label} className="min-w-[10rem] flex-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="shrink-0 whitespace-nowrap text-xs font-black text-slate-950">{item.label}</span>
              <span className="shrink-0 whitespace-nowrap text-[11px] font-black text-slate-400">{item.hint}</span>
            </div>
            <p className="line-clamp-3 break-words text-xs font-semibold leading-5 text-slate-700">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScriptTableBlock({
  table,
  tableId,
  regenerating = false,
  onRegenerateTable,
}: {
  table: ScriptTable;
  tableId: string;
  regenerating?: boolean;
  onRegenerateTable?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const promptColumnIndexes = table.columns.map((column, index) => (isPromptColumn(column) ? index : -1)).filter((index) => index >= 0);
  const hasLongContent = table.rows.some((row) => row.some((cell) => cell.length > 110));

  async function copyTable() {
    await navigator.clipboard.writeText(tableText([table]));
  }

  return (
    <section id={tableId} className="scroll-mt-28 min-w-0 rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Table2 size={14} className="text-slate-400" />
            <h3 className="truncate text-sm font-black text-slate-950">{table.title}</h3>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {table.columns.length} 列 / {table.rows.length} 行
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {promptColumnIndexes.length ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
              <ImageIcon size={12} />
              图片提示词
            </span>
          ) : null}
          {hasLongContent ? (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600"
              type="button"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "收起" : "展开"}
            </button>
          ) : null}
          <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-black text-slate-600" type="button" onClick={copyTable}>
            <Copy size={12} />
            复制本表
          </button>
          {onRegenerateTable ? (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-black text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={regenerating}
              onClick={onRegenerateTable}
            >
              <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
              {regenerating ? "生成中" : "重新生成"}
            </button>
          ) : null}
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {table.columns.map((column, index) => (
                <th key={`${table.id}-head-${index}`} className={cn("whitespace-nowrap px-3 py-2 font-black", isPromptColumn(column) ? "bg-emerald-50 text-emerald-700" : "")}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.id}-${rowIndex}`} className="align-top">
                {row.map((cell, cellIndex) => {
                  const promptCell = promptColumnIndexes.includes(cellIndex);
                  return (
                    <td
                      key={`${table.id}-${rowIndex}-${cellIndex}`}
                      className={cn(
                        "max-w-[24rem] whitespace-pre-wrap px-3 py-2 leading-5 text-slate-700",
                        promptCell ? "bg-emerald-50/60 font-semibold text-emerald-900" : "",
                      )}
                    >
                      <div className={cn(!expanded && cell.length > 140 ? "max-h-16 overflow-hidden" : "")}>{cell}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScriptTableSection({
  title,
  description,
  tabKey,
  tables,
  startIndex,
  defaultOpen = false,
  tone = "default",
  regeneratingTableKey = null,
  onRegenerateTable,
}: {
  title: string;
  description: string;
  tabKey: TabKey;
  tables: ScriptTable[];
  startIndex: number;
  defaultOpen?: boolean;
  tone?: "default" | "muted" | "technical";
  regeneratingTableKey?: string | null;
  onRegenerateTable?: (target: TableRegenerateTarget) => void;
}) {
  if (tables.length === 0) return null;

  const body = (
    <div className={cn("grid gap-3", defaultOpen ? "mt-3" : "mt-0 border-t border-slate-200 p-3")}>
      {tables.map((table, index) => (
        <ScriptTableBlock
          key={table.id}
          table={table}
          tableId={tableDomId(tabKey, table, startIndex + index)}
          regenerating={regeneratingTableKey === `${groupKeyForTab(tabKey)}:${table.id}`}
          onRegenerateTable={onRegenerateTable ? () => onRegenerateTable({ groupKey: groupKeyForTab(tabKey), tableId: table.id }) : undefined}
        />
      ))}
    </div>
  );

  const heading = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{description}</p>
      </div>
      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-500">{tables.length} 张表</span>
    </div>
  );

  if (defaultOpen) {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        {heading}
        {body}
      </section>
    );
  }

  return (
    <details className={cn("rounded-xl border bg-white", tone === "technical" ? "border-violet-200" : tone === "muted" ? "border-amber-200" : "border-slate-200")}>
      <summary className="cursor-pointer list-none p-3">{heading}</summary>
      {body}
    </details>
  );
}

function ScriptDirectory({ tabKey, tables }: { tabKey: TabKey; tables: ScriptTable[] }) {
  if (tables.length === 0) return null;

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2">
          <List size={14} className="text-slate-400" />
          <p className="text-xs font-black text-slate-950">表格目录</p>
        </div>
        <div className="grid max-h-[60vh] gap-1 overflow-y-auto pr-1">
          {tables.map((table, index) => (
            <button
              key={`${table.id}-${index}`}
              className="truncate rounded-md px-2 py-1.5 text-left text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
              type="button"
              onClick={() => scrollToTable(tableDomId(tabKey, table, index))}
              title={table.title}
            >
              {index + 1}. {table.title}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function imagesByCurrentPrompt(images: ScriptImageView[], prompts: ScriptImagePromptView[]) {
  const promptHashes = new Map(prompts.map((prompt) => [prompt.pageKey, prompt.promptHash]));
  const result = new Map<string, ScriptImageView>();
  for (const image of images) {
    const expectedHash = promptHashes.get(image.pageKey);
    if (expectedHash && image.promptHash !== expectedHash) continue;
    const previous = result.get(image.pageKey);
    if (!previous || new Date(image.updatedAt).getTime() > new Date(previous.updatedAt).getTime()) {
      result.set(image.pageKey, image);
    }
  }
  return result;
}

function imageStatusLabel(status: ScriptImageView["status"] | undefined) {
  if (status === "READY") return "已生成";
  if (status === "FAILED") return "生成失败";
  if (status === "GENERATING") return "生成中";
  return "未生成";
}

function reviewStatusTone(status: ScriptReviewView["status"] | undefined, stale?: boolean) {
  if (stale) return "warning" as const;
  if (status === "READY") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "GENERATING") return "info" as const;
  return "neutral" as const;
}

function ScriptPublishReviewPanel({ record, readOnly }: { record: ScriptGenerationView; readOnly: boolean }) {
  const [review, setReview] = useState<ScriptReviewView | null>(record.scriptReviews?.[0] ?? null);
  const [loading, setLoading] = useState(!readOnly);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readOnly) return;
    let active = true;
    void fetch(`/api/creator/trends/scripts/review?scriptGenerationId=${encodeURIComponent(record.id)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as { review?: ScriptReviewView | null; error?: string };
        if (!active) return;
        if (!response.ok) throw new Error(payload.error ?? "发布检查读取失败");
        setReview(payload.review ?? null);
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : "发布检查读取失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [readOnly, record.id, record.scriptReviews]);

  async function runReview(force = false) {
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/creator/trends/scripts/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptGenerationId: record.id, force }),
      });
      const payload = (await response.json().catch(() => ({}))) as { review?: ScriptReviewView; error?: string };
      if (!response.ok || !payload.review) throw new Error(payload.error ?? "AI 发布检查失败");
      setReview(payload.review);
      if (payload.review.status === "READY") toast.success("AI 发布检查完成");
      if (payload.review.status === "FAILED") toast.error(payload.review.errorMessage ?? "AI 发布检查失败");
    } catch (reviewError) {
      const message = reviewError instanceof Error ? reviewError.message : "AI 发布检查失败";
      setError(message);
      toast.error(message);
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-28 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs font-black text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        发布检查状态读取中
      </div>
    );
  }

  if (!review) {
    return (
      <WorkbenchEmptyState title="尚未进行 AI 发布检查" body="生成脚本和图片后，可以让 AI 读取图片内容并检查中文文字、合规风险、发布包装和平台适配。">
        {!readOnly ? (
          <button
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={checking}
            onClick={() => void runReview(false)}
          >
            {checking ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            AI 检查发布风险
          </button>
        ) : null}
      </WorkbenchEmptyState>
    );
  }

  const failingItems = review.riskItems.filter((item) => item.severity !== "LOW");
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck size={16} className="text-teal-600" />
            <p className="text-sm font-black text-slate-950">AI 发布检查</p>
            <WorkbenchStatusBadge tone={reviewStatusTone(review.status, review.stale)}>
              {review.stale ? "已过期" : review.status === "READY" ? "已完成" : review.status === "FAILED" ? "失败" : "检查中"}
            </WorkbenchStatusBadge>
            {review.score != null ? <WorkbenchStatusBadge tone={review.score >= 80 ? "success" : review.score >= 60 ? "warning" : "danger"}>{review.score} 分</WorkbenchStatusBadge> : null}
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{review.summary ?? review.errorMessage ?? "暂无摘要。"}</p>
        </div>
        {!readOnly ? (
          <button
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={checking}
            onClick={() => void runReview(true)}
          >
            {checking ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            重新检查
          </button>
        ) : null}
      </div>
      {error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div> : null}
      <div className="mt-3 grid gap-2">
        {review.checks.slice(0, 5).map((check) => (
          <div key={check.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-slate-950">{check.label}</p>
              <WorkbenchStatusBadge tone={check.status === "PASS" ? "success" : check.status === "FAIL" ? "danger" : "warning"}>{check.status}</WorkbenchStatusBadge>
            </div>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{check.detail}</p>
          </div>
        ))}
      </div>
      {review.imageFindings.length ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-black text-slate-950">图片逐页检查</p>
          <div className="grid gap-2">
            {review.imageFindings.slice(0, 6).map((finding) => (
              <div key={finding.pageKey} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-black text-slate-900">{finding.pageLabel}</p>
                  <WorkbenchStatusBadge tone={finding.status === "PASS" ? "success" : finding.status === "FAIL" ? "danger" : "warning"}>{finding.status}</WorkbenchStatusBadge>
                </div>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{finding.textAccuracy}</p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">{finding.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {failingItems.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs font-black text-amber-900">发布前优先处理</p>
          <ul className="mt-1 space-y-1 text-[11px] font-semibold leading-4 text-amber-800">
            {failingItems.slice(0, 4).map((item, index) => (
              <li key={`${item.detail}-${index}`}>{item.detail}：{item.suggestion}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ScriptImagesPanel({ record, readOnly }: { record: ScriptGenerationView; readOnly: boolean }) {
  const [prompts, setPrompts] = useState<ScriptImagePromptView[]>([]);
  const [images, setImages] = useState<ScriptImageView[]>(record.scriptImages ?? []);
  const [loading, setLoading] = useState(!readOnly);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingPageKey, setGeneratingPageKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readOnly) return;
    let active = true;
    void fetch(`/api/creator/trends/scripts/images?scriptGenerationId=${encodeURIComponent(record.id)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as { prompts?: ScriptImagePromptView[]; images?: ScriptImageView[]; error?: string };
        if (!active) return;
        if (!response.ok) throw new Error(payload.error ?? "图片状态读取失败");
        setPrompts(payload.prompts ?? []);
        setImages(payload.images ?? []);
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(fetchError instanceof Error ? fetchError.message : "图片状态读取失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [readOnly, record.id]);

  const currentImages = useMemo(() => imagesByCurrentPrompt(images, prompts), [images, prompts]);
  const readOnlyImages = useMemo(() => [...images].sort((a, b) => a.pageOrder - b.pageOrder), [images]);
  const promptCards = prompts.length
    ? prompts.map((prompt) => ({ key: prompt.pageKey, pageLabel: prompt.pageLabel, pageOrder: prompt.pageOrder, aspectRatio: prompt.aspectRatio, size: prompt.size, overlayText: prompt.overlayText, image: currentImages.get(prompt.pageKey) }))
    : readOnlyImages.map((image) => ({ key: image.pageKey, pageLabel: image.pageLabel, pageOrder: image.pageOrder, aspectRatio: image.aspectRatio, size: image.size, overlayText: "", image }));
  const readyCount = promptCards.filter((item) => item.image?.status === "READY" && item.image.imageUrl).length;

  async function requestImages(pageKey?: string) {
    setError(null);
    if (pageKey) {
      setGeneratingPageKey(pageKey);
    } else {
      setGeneratingAll(true);
    }

    if (!pageKey && prompts.length > 0) {
      setImages((current) => [
        ...current.filter((image) => !prompts.some((prompt) => prompt.pageKey === image.pageKey && prompt.promptHash === image.promptHash)),
        ...prompts.map((prompt, index) => ({
          id: `pending-${prompt.pageKey}-${Date.now()}-${index}`,
          pageKey: prompt.pageKey,
          pageLabel: prompt.pageLabel,
          pageOrder: prompt.pageOrder,
          model: "",
          promptHash: prompt.promptHash,
          prompt: prompt.prompt,
          negativePrompt: prompt.negativePrompt,
          aspectRatio: prompt.aspectRatio,
          size: prompt.size,
          imageUrl: null,
          status: "GENERATING" as const,
          errorMessage: null,
          generatedAt: null,
          updatedAt: new Date().toISOString(),
        })),
      ]);
    }

    try {
      const response = await fetch("/api/creator/trends/scripts/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptGenerationId: record.id, pageKey: pageKey ?? null, force: Boolean(pageKey) || readyCount > 0 }),
      });
      const payload = (await response.json().catch(() => ({}))) as { prompts?: ScriptImagePromptView[]; images?: ScriptImageView[]; errors?: string[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "图片生成失败");
      setPrompts(payload.prompts ?? prompts);
      setImages(payload.images ?? []);
      if (payload.errors?.length) {
        setError(payload.errors.join("；"));
        toast.warning("部分图片生成失败");
      } else {
        toast.success(pageKey ? "本页图片已生成" : "图片批量生成完成");
      }
    } catch (generateError) {
      const message = generateError instanceof Error ? generateError.message : "图片生成失败";
      setError(message);
      toast.error(message);
    } finally {
      setGeneratingAll(false);
      setGeneratingPageKey(null);
    }
  }

  if (readOnly && readOnlyImages.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-slate-400" />
          <p className="text-sm font-black text-slate-950">图片成片</p>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">创作者尚未生成图片。</p>
      </section>
    );
  }

  if (!readOnly && !loading && prompts.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-slate-400" />
          <p className="text-sm font-black text-slate-950">图片成片</p>
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">当前脚本没有可识别的图片生成提示词表。</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-teal-100 bg-white p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-teal-600" />
            <p className="text-sm font-black text-slate-950">图片成片</p>
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-black text-teal-700">
              {readyCount}/{promptCards.length || images.length}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">使用图片提示词直接生成包含中文文字的成片图。</p>
        </div>
        {!readOnly ? (
          <button
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={loading || generatingAll || prompts.length === 0}
            onClick={() => void requestImages()}
          >
            {generatingAll ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {readyCount > 0 ? `重新生成全部图片` : `生成 ${prompts.length || "全部"} 张图片`}
          </button>
        ) : null}
      </div>
      {error ? <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{error}</div> : null}
      {loading ? (
        <div className="mt-3 flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs font-black text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          图片状态读取中
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {promptCards.map((item) => {
            const image = item.image;
            const busy = generatingAll || generatingPageKey === item.key || image?.status === "GENERATING";
            return (
              <div key={item.key} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <div className="relative aspect-[3/4] bg-slate-100">
                  {image?.imageUrl ? <Image alt={item.pageLabel} className="object-cover" fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" src={image.imageUrl} unoptimized /> : null}
                  {!image?.imageUrl || busy ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 px-4 text-center text-xs font-black text-slate-500">
                      {busy ? <Loader2 className="animate-spin text-teal-600" size={20} /> : <ImageIcon size={20} />}
                      <span>{busy ? "生成中" : imageStatusLabel(image?.status)}</span>
                      {image?.status === "FAILED" && image.errorMessage ? <span className="line-clamp-2 font-semibold text-red-500">{image.errorMessage}</span> : null}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-950">{item.pageLabel}</p>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-black text-slate-500">{item.aspectRatio ?? image?.aspectRatio ?? "3:4"}</span>
                  </div>
                  {item.overlayText ? <p className="line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">{item.overlayText}</p> : null}
                  {!readOnly ? (
                    <button
                      className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-black text-slate-600 transition hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      disabled={busy}
                      onClick={() => void requestImages(item.key)}
                    >
                      {generatingPageKey === item.key ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      重生成本页
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const QUICK_INSTRUCTIONS = [
  "更口语化",
  "更像小红书",
  "更适合抖音",
  "更详细",
  "缩短到 45 秒",
  "增加图片生成提示词",
  "强化爆款拆解",
  "降低广告感",
];

function ScriptGenerationPendingPanel({ pendingScript }: { pendingScript: PendingScriptGeneration }) {
  const steps = [
    { title: "理解选题语境", body: "匹配方向、平台和爆点角度。", active: true },
    { title: "生成脚本表", body: "整理图文、视频和 CTA 结构。", active: true },
    { title: "准备发布检查", body: "补齐封面、图片提示词和风险项。", active: false },
  ];

  return (
    <div className="min-w-0">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 py-3 backdrop-blur">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="max-w-3xl truncate text-lg font-black text-slate-950">{pendingScript.sourceTitle}</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-700">
              <Loader2 size={12} className="animate-spin" />
              生成中
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-500">
              {pendingScript.platformLabel}
            </span>
          </div>
          <p className="text-xs font-semibold leading-5 text-slate-500">
            正在为「{pendingScript.directionLabel}」方向生成可复制、可评审、可执行的脚本工作台。
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <section className="overflow-hidden rounded-xl border border-teal-100 bg-white shadow-sm">
          <div className="border-b border-teal-100 bg-teal-50/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">AI 正在搭建脚本结构</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">生成完成后，右侧会自动切换到完整脚本表。</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Loader2 size={20} className="animate-spin" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full w-2/3 rounded-full bg-teal-500 transition-all" />
            </div>
          </div>

          <div className="grid gap-3 p-4">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
                    step.active ? "bg-teal-600 text-white" : "bg-white text-slate-400",
                  )}
                >
                  {step.active ? <Loader2 size={14} className="animate-spin" /> : index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950">{step.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-3 grid grid-cols-4 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {["摘要", "图片", "表格", "发布检查"].map((item, index) => (
              <div key={item} className={cn("rounded-md px-2 py-2 text-center text-xs font-black", index === 0 ? "bg-white text-slate-950 shadow-sm" : "text-slate-400")}>
                {item}
              </div>
            ))}
          </div>
          <div className="grid gap-3">
            <div className="h-20 rounded-xl bg-slate-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 rounded-xl bg-slate-100" />
              <div className="h-24 rounded-xl bg-slate-100" />
            </div>
            <div className="h-32 rounded-xl bg-slate-100" />
          </div>
        </section>
      </div>
    </div>
  );
}

export function ScriptTablesPanel({ record, pendingScript = null, readOnly = false, onRegenerate, onRecordUpdate, regenerating = false, allowTableRegenerate = false }: Omit<Props, "open" | "onClose">) {
  const [localRecord, setLocalRecord] = useState<ScriptGenerationView | null>(null);
  const [regeneratingTableKey, setRegeneratingTableKey] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const currentRecord = localRecord?.id === record?.id ? localRecord : record;

  const tabs = useMemo(() => tablesByTab(currentRecord), [currentRecord]);
  const [requestedTab, setRequestedTab] = useState<TabKey>("graphic");
  const [workspaceTab, setWorkspaceTab] = useState("summary");
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const active = tabs.find((tab) => tab.key === requestedTab) ?? tabs[0];
  const activeGroups = active ? classifyTables(active.key, active.tables) : null;
  const directoryTables = visibleDirectoryTables(activeGroups, readOnly);
  const totalRows = tabs.reduce((sum, tab) => sum + tab.tables.reduce((tableSum, table) => tableSum + table.rows.length, 0), 0);
  const summaryItems = useMemo(() => (currentRecord ? buildSummaryItems(currentRecord) : []), [currentRecord]);
  const isFallback = currentRecord?.generationMode === "FALLBACK";
  const readyImages = currentRecord?.scriptImages.filter((image) => image.status === "READY" && image.imageUrl).length ?? 0;
  const latestReview = currentRecord?.scriptReviews?.[0] ?? null;
  const workflowDone = (currentRecord?.status === "READY" ? 1 : 0) + (readyImages > 0 ? 1 : 0) + (latestReview?.status === "READY" && !latestReview.stale ? 1 : 0);

  if (!currentRecord && pendingScript) {
    return <ScriptGenerationPendingPanel pendingScript={pendingScript} />;
  }

  if (!currentRecord) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">暂无脚本记录</div>;
  }

  async function copyCurrent() {
    if (!active) return;
    await navigator.clipboard.writeText(tableText(active.tables));
  }

  async function copyAll() {
    await navigator.clipboard.writeText(currentRecord?.plainText || tableText(tabs.flatMap((tab) => tab.tables)));
  }

  function applyQuickInstruction(tag: string) {
    setInstruction((value) => {
      if (!value.trim()) return tag;
      if (value.includes(tag)) return value;
      return `${value}，${tag}`;
    });
  }

  async function regenerateTable(target: TableRegenerateTarget) {
    if (!currentRecord || regeneratingTableKey) return;
    const key = `${target.groupKey}:${target.tableId}`;
    setRegeneratingTableKey(key);
    try {
      const response = await fetch("/api/creator/trends/scripts/tables/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptGenerationId: currentRecord.id,
          groupKey: target.groupKey,
          tableId: target.tableId,
          userInstruction: instruction.trim() || null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { record?: ScriptGenerationView; error?: string };
      if (!response.ok || !payload.record) throw new Error(payload.error ?? "单表重新生成失败");
      setLocalRecord(payload.record);
      onRecordUpdate?.(payload.record);
      toast.success("表格已重新生成");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "单表重新生成失败");
    } finally {
      setRegeneratingTableKey(null);
    }
  }

  const secondaryStartIndex = activeGroups ? activeGroups.primary.length : 0;
  const technicalStartIndex = activeGroups ? activeGroups.primary.length + activeGroups.secondary.length : 0;

  return (
    <div className={cn("min-w-0", fullscreen ? "fixed inset-0 z-[80] overflow-y-auto bg-slate-50 p-5" : "")}>
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="max-w-3xl truncate text-lg font-black text-slate-950">{currentRecord.sourceTitle}</h2>
              <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", currentRecord.generationMode === "AI" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                {currentRecord.generationMode === "AI" ? "AI 生成" : "AI 失败 · 规则兜底"}
              </span>
              <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", currentRecord.status === "READY" ? "border-blue-200 bg-blue-50 text-blue-700" : currentRecord.status === "FAILED" ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-500")}>
                {currentRecord.status === "READY" ? (isFallback ? "兜底草稿" : "已生成") : currentRecord.status === "FAILED" ? "生成失败" : "生成中"}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-500">
                {tabs.length} 组 / {totalRows} 行
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              生成时间：{formatTime(currentRecord.generatedAt)} · 模型：{currentRecord.model ?? "未记录"}
              {currentRecord.userInstruction ? ` · 重新生成要求：${currentRecord.userInstruction}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={regenerating} onClick={copyCurrent}>
              <Copy size={14} />
              复制当前组
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={regenerating} onClick={copyAll}>
              <Copy size={14} />
              复制全部
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:text-slate-900"
              type="button"
              onClick={() => setFullscreen((value) => !value)}
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {fullscreen ? "退出全屏" : "脚本全屏"}
            </button>
            {!readOnly && onRegenerate ? (
              <button
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60",
                  instructionOpen ? "border-slate-950 bg-slate-950 text-white" : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100",
                )}
                type="button"
                disabled={regenerating}
                onClick={() => setInstructionOpen((next) => !next)}
              >
                <RefreshCw size={14} />
                {instructionOpen ? "收起重生成" : "重新生成"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {regenerating ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold leading-6 text-teal-900">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 shrink-0 animate-spin text-teal-600" size={18} />
              <div className="min-w-0">
                <p className="font-black">正在重新生成，完成后将替换当前结果</p>
                <p className="mt-0.5 text-xs text-teal-700">旧脚本会保留在这里，生成结束前可以继续阅读。</p>
              </div>
            </div>
          </div>
        ) : null}

        {isFallback ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
            当前不是 AI 成功生成结果，而是中转站请求失败后的规则兜底草稿。它只用于临时占位和继续编辑，建议稍后点击“重新生成”获取真正的 AI 脚本。
            {currentRecord.errorMessage ? <span className="mt-1 block text-xs text-amber-800">诊断：{currentRecord.errorMessage}</span> : null}
          </div>
        ) : null}

        {instructionOpen && !readOnly ? (
          <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3">
            <label className="text-xs font-black text-teal-900" htmlFor="script-regenerate-instruction">
              重新生成要求（可选）
            </label>
            <textarea
              id="script-regenerate-instruction"
              className="mt-2 min-h-16 w-full rounded-lg border border-teal-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-teal-300"
              placeholder="例如：更口语化，更适合小红书，视频控制在 60 秒内，图文增加图片生成提示词。"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {QUICK_INSTRUCTIONS.map((tag) => (
                <button key={tag} className="shrink-0 rounded-full border border-teal-200 bg-white px-2.5 py-1 text-xs font-black text-teal-700 transition hover:bg-teal-50" type="button" onClick={() => applyQuickInstruction(tag)}>
                  {tag}
                </button>
              ))}
            </div>
            <button
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={regenerating}
              onClick={() => onRegenerate?.(instruction.trim())}
            >
              <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} />
              {regenerating ? "正在重新生成..." : "确认重新生成"}
            </button>
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-teal-600" />
              <p className="text-sm font-black text-slate-950">创作进度</p>
              <WorkbenchStatusBadge tone={workflowDone >= 3 ? "success" : workflowDone >= 2 ? "info" : "neutral"}>{workflowDone}/3</WorkbenchStatusBadge>
            </div>
            <div className="w-full sm:w-44">
              <WorkbenchProgress value={workflowDone} total={3} />
            </div>
          </div>
          <WorkbenchTabs
            value={workspaceTab}
            onValueChange={setWorkspaceTab}
            tabs={[
              { value: "summary", label: "摘要", content: <ScriptSummaryCards items={summaryItems} /> },
              { value: "images", label: "图片", content: <ScriptImagesPanel key={currentRecord.id} record={currentRecord} readOnly={readOnly} /> },
              { value: "tables", label: "表格", content: <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">下方展示完整脚本表格，可继续切换图文、视频和案例拆解。</div> },
              { value: "review", label: "发布检查", content: <ScriptPublishReviewPanel record={currentRecord} readOnly={readOnly} /> },
            ]}
          />
        </section>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const groups = classifyTables(tab.key, tab.tables);
            return (
              <button
                key={tab.key}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-black transition",
                  active?.key === tab.key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-500 hover:text-slate-900",
                )}
                type="button"
                onClick={() => setRequestedTab(tab.key)}
              >
                {tab.label} · 核心 {groups.primary.length} / 全量 {tab.tables.length}
              </button>
            );
          })}
        </div>

        {active && activeGroups ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="grid min-w-0 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold leading-5 text-slate-500">
                默认展示能直接用于创作的核心表：选题、封面、正文/口播、分镜、图片提示词和发布包装。
                {readOnly ? " Admin 详情页保留技术表和完整记录。" : " Remotion 等技术表在后台保留。"}
              </div>
              <ScriptTableSection
                title="默认展示"
                description="优先展示能直接复制、评审和执行的核心表。"
                tabKey={active.key}
                tables={activeGroups.primary}
                startIndex={0}
                defaultOpen
                regeneratingTableKey={regeneratingTableKey}
                onRegenerateTable={allowTableRegenerate ? (target) => void regenerateTable(target) : undefined}
              />
              <ScriptTableSection
                title="补充表"
                description="合规风险、制作细节、逐镜头拆解等低频查看内容，默认折叠。"
                tabKey={active.key}
                tables={activeGroups.secondary}
                startIndex={secondaryStartIndex}
                tone="muted"
                regeneratingTableKey={regeneratingTableKey}
                onRegenerateTable={allowTableRegenerate ? (target) => void regenerateTable(target) : undefined}
              />
              {readOnly ? (
                <ScriptTableSection
                  title="技术 / Admin 表"
                  description="Remotion 映射、实现参数和排查信息，仅后台默认可看。"
                  tabKey={active.key}
                  tables={activeGroups.technical}
                  startIndex={technicalStartIndex}
                  tone="technical"
                  regeneratingTableKey={regeneratingTableKey}
                  onRegenerateTable={allowTableRegenerate ? (target) => void regenerateTable(target) : undefined}
                />
              ) : activeGroups.technical.length > 0 ? (
                <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs font-semibold text-violet-700">
                  已隐藏 {activeGroups.technical.length} 张技术实现表，Admin 后台可查看完整记录。
                </div>
              ) : null}
            </div>
            <ScriptDirectory tabKey={active.key} tables={directoryTables} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ScriptGenerationWorkspace({ record, pendingScript = null, readOnly = false, onRegenerate, onRecordUpdate, regenerating = false, allowTableRegenerate = false }: Omit<Props, "open" | "onClose">) {
  if (!record && pendingScript) {
    return <ScriptTablesPanel record={record} pendingScript={pendingScript} readOnly={readOnly} onRegenerate={onRegenerate} onRecordUpdate={onRecordUpdate} regenerating={regenerating} allowTableRegenerate={allowTableRegenerate} />;
  }
  if (!record) {
    return <WorkbenchEmptyState title="选择一个热点开始创作" body="打开或生成脚本后，这里会显示脚本摘要、图片成片、完整表格和 AI 发布检查。" />;
  }
  return <ScriptTablesPanel record={record} pendingScript={pendingScript} readOnly={readOnly} onRegenerate={onRegenerate} onRecordUpdate={onRecordUpdate} regenerating={regenerating} allowTableRegenerate={allowTableRegenerate} />;
}

export function ScriptGenerationDrawer({ record, pendingScript = null, open = false, readOnly = false, onClose, onRegenerate, onRecordUpdate, regenerating = false, allowTableRegenerate = false }: Props) {
  if (!open || (!record && !pendingScript)) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40">
      <div className="absolute inset-y-0 right-0 flex w-full max-w-6xl flex-col bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">脚本表格</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">图文、视频和爆款拆解统一按表格展示</p>
          </div>
          <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-950" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <ScriptGenerationWorkspace record={record} pendingScript={pendingScript} readOnly={readOnly} onRegenerate={onRegenerate} onRecordUpdate={onRecordUpdate} regenerating={regenerating} allowTableRegenerate={allowTableRegenerate} />
        </div>
      </div>
    </div>
  );
}
