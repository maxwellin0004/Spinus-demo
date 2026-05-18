"use client";

import { ChevronDown, ChevronUp, Copy, ImageIcon, List, RefreshCw, Table2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ScriptGenerationView, ScriptTable } from "@/lib/insights/script-tables";
import { cn } from "@/lib/utils";

type TabKey = "case" | "graphic" | "video";
type TableVisibility = "primary" | "secondary" | "technical";

type Props = {
  record: ScriptGenerationView | null;
  open?: boolean;
  readOnly?: boolean;
  onClose?: () => void;
  onRegenerate?: (instruction: string) => void;
  regenerating?: boolean;
};

type ScriptTab = {
  key: TabKey;
  label: string;
  tables: ScriptTable[];
};

type SummaryItem = {
  label: string;
  value: string;
  hint: string;
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
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-950">{item.label}</span>
              <span className="shrink-0 text-[11px] font-black text-slate-400">{item.hint}</span>
            </div>
            <p className="line-clamp-3 text-xs font-semibold leading-5 text-slate-700">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScriptTableBlock({ table, tableId }: { table: ScriptTable; tableId: string }) {
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
}: {
  title: string;
  description: string;
  tabKey: TabKey;
  tables: ScriptTable[];
  startIndex: number;
  defaultOpen?: boolean;
  tone?: "default" | "muted" | "technical";
}) {
  if (tables.length === 0) return null;

  const body = (
    <div className={cn("grid gap-3", defaultOpen ? "mt-3" : "mt-0 border-t border-slate-200 p-3")}>
      {tables.map((table, index) => (
        <ScriptTableBlock key={table.id} table={table} tableId={tableDomId(tabKey, table, startIndex + index)} />
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

export function ScriptTablesPanel({ record, readOnly = false, onRegenerate, regenerating = false }: Omit<Props, "open" | "onClose">) {
  const tabs = useMemo(() => tablesByTab(record), [record]);
  const [requestedTab, setRequestedTab] = useState<TabKey>("graphic");
  const [instructionOpen, setInstructionOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const active = tabs.find((tab) => tab.key === requestedTab) ?? tabs[0];
  const activeGroups = active ? classifyTables(active.key, active.tables) : null;
  const directoryTables = visibleDirectoryTables(activeGroups, readOnly);
  const totalRows = tabs.reduce((sum, tab) => sum + tab.tables.reduce((tableSum, table) => tableSum + table.rows.length, 0), 0);
  const summaryItems = useMemo(() => (record ? buildSummaryItems(record) : []), [record]);
  const isFallback = record?.generationMode === "FALLBACK";

  if (!record) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-400">暂无脚本记录</div>;
  }

  async function copyCurrent() {
    if (!active) return;
    await navigator.clipboard.writeText(tableText(active.tables));
  }

  async function copyAll() {
    await navigator.clipboard.writeText(record?.plainText || tableText(tabs.flatMap((tab) => tab.tables)));
  }

  function applyQuickInstruction(tag: string) {
    setInstruction((value) => {
      if (!value.trim()) return tag;
      if (value.includes(tag)) return value;
      return `${value}，${tag}`;
    });
  }

  const secondaryStartIndex = activeGroups ? activeGroups.primary.length : 0;
  const technicalStartIndex = activeGroups ? activeGroups.primary.length + activeGroups.secondary.length : 0;

  return (
    <div className="min-w-0">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="max-w-3xl truncate text-lg font-black text-slate-950">{record.sourceTitle}</h2>
              <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", record.generationMode === "AI" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                {record.generationMode === "AI" ? "AI 生成" : "AI 失败 · 规则兜底"}
              </span>
              <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", record.status === "READY" ? "border-blue-200 bg-blue-50 text-blue-700" : record.status === "FAILED" ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-500")}>
                {record.status === "READY" ? (isFallback ? "兜底草稿" : "已生成") : record.status === "FAILED" ? "生成失败" : "生成中"}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-slate-500">
                {tabs.length} 组 / {totalRows} 行
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              生成时间：{formatTime(record.generatedAt)} · 模型：{record.model ?? "未记录"}
              {record.userInstruction ? ` · 重新生成要求：${record.userInstruction}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:text-slate-900" type="button" onClick={copyCurrent}>
              <Copy size={14} />
              复制当前组
            </button>
            <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:text-slate-900" type="button" onClick={copyAll}>
              <Copy size={14} />
              复制全部
            </button>
            {!readOnly && onRegenerate ? (
              <button
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-black transition",
                  instructionOpen ? "border-slate-950 bg-slate-950 text-white" : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100",
                )}
                type="button"
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
        {isFallback ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
            当前不是 AI 成功生成结果，而是中转站请求失败后的规则兜底草稿。它只用于临时占位和继续编辑，建议稍后点击“重新生成”获取真正的 AI 脚本。
            {record.errorMessage ? <span className="mt-1 block text-xs text-amber-800">诊断：{record.errorMessage}</span> : null}
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

        <ScriptSummaryCards items={summaryItems} />

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
              />
              <ScriptTableSection
                title="补充表"
                description="合规风险、制作细节、逐镜头拆解等低频查看内容，默认折叠。"
                tabKey={active.key}
                tables={activeGroups.secondary}
                startIndex={secondaryStartIndex}
                tone="muted"
              />
              {readOnly ? (
                <ScriptTableSection
                  title="技术 / Admin 表"
                  description="Remotion 映射、实现参数和排查信息，仅后台默认可看。"
                  tabKey={active.key}
                  tables={activeGroups.technical}
                  startIndex={technicalStartIndex}
                  tone="technical"
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

export function ScriptGenerationDrawer({ record, open = false, readOnly = false, onClose, onRegenerate, regenerating = false }: Props) {
  if (!open || !record) return null;
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
          <ScriptTablesPanel record={record} readOnly={readOnly} onRegenerate={onRegenerate} regenerating={regenerating} />
        </div>
      </div>
    </div>
  );
}
