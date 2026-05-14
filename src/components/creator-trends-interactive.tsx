"use client";

import { createContext, useContext, useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, Search } from "lucide-react";
import { CreatorTrendChart, type CreatorTrendPoint } from "@/components/creator-trend-chart";
import { cn } from "@/lib/utils";

type TrendRange = "24h" | "7d" | "30d";
type TrendPlatform = "all" | "xiaohongshu" | "douyin" | "weibo" | "bilibili";

export type CreatorTrendFilters = {
  range: TrendRange;
  platform: TrendPlatform;
  direction: string;
  scenario: string;
  keyword: string;
};

type DirectionOption = {
  slug: string;
  label: string;
  chips: string[];
  creatorTrendLabels: string[];
};

type TopicRow = {
  rank: number;
  topic: string;
  stage: "爆发中" | "长尾可做" | "谨慎跟进";
  heat: string;
  match: string;
  competition: "低" | "中" | "高";
  difficulty: "低" | "中" | "高";
  platforms: string[];
  advice: "立即跟进" | "可长期做" | "谨慎跟进";
  source?: string;
};

type SourceKind = "真实采集" | "规则计算" | "示例兜底";

const rangeFilters = [
  { label: "24小时", value: "24h" as const, days: 1 },
  { label: "近7天", value: "7d" as const, days: 7 },
  { label: "30天", value: "30d" as const, days: 30 },
];

const platformFilters = [
  { label: "全部", value: "all" as const },
  { label: "小红书", value: "xiaohongshu" as const },
  { label: "抖音", value: "douyin" as const },
  { label: "微博", value: "weibo" as const },
  { label: "B站", value: "bilibili" as const },
];

const scenarioFilters = [
  { label: "达人运营", value: "creator_ops" },
  { label: "选题种草", value: "topic_seeding" },
  { label: "爆款复盘", value: "case_review" },
];

const moreKeywordChips = ["通勤", "显白", "平价替代", "避坑", "新品", "教程"];

const platformName: Record<TrendPlatform, string> = {
  all: "全部",
  xiaohongshu: "小红书",
  douyin: "抖音",
  weibo: "微博",
  bilibili: "B站",
};

function buildUrl(filters: CreatorTrendFilters, hash = "") {
  const params = new URLSearchParams();
  if (filters.range !== "7d") params.set("range", filters.range);
  if (filters.platform !== "all") params.set("platform", filters.platform);
  if (filters.direction !== "beauty") params.set("direction", filters.direction);
  if (filters.scenario !== "creator_ops") params.set("scenario", filters.scenario);
  if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
  const query = params.toString();
  return `/creator/trends${query ? `?${query}` : ""}${hash}`;
}

type FilterContextValue = {
  filters: CreatorTrendFilters;
  directions: DirectionOption[];
  currentDirection: DirectionOption;
  setFilters: (patch: Partial<CreatorTrendFilters>, hash?: string, options?: { navigate?: boolean; scroll?: boolean }) => void;
  isNavigating: boolean;
};

const FilterContext = createContext<FilterContextValue | null>(null);

function useFilters() {
  const value = useContext(FilterContext);
  if (!value) throw new Error("CreatorTrendFilterProvider is missing.");
  return value;
}

export function useCreatorTrendFilters() {
  return useFilters();
}

export function CreatorTrendFilterProvider({
  initialFilters,
  directions,
  children,
}: {
  initialFilters: CreatorTrendFilters;
  directions: DirectionOption[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [filters, setLocalFilters] = useState(initialFilters);
  const [isNavigating, startTransition] = useTransition();
  const currentDirection = directions.find((item) => item.slug === filters.direction) ?? directions[0];

  function setFilters(
    patch: Partial<CreatorTrendFilters>,
    hash = "",
    options?: { navigate?: boolean; scroll?: boolean },
  ) {
    const next = { ...filters, ...patch };
    setLocalFilters(next);
    const nextUrl = buildUrl(next, hash);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", nextUrl);
    }
    if (options?.navigate === false) return;
    startTransition(() => {
      router.replace(nextUrl, { scroll: options?.scroll ?? false });
    });
  }

  const value = { filters, directions, currentDirection, setFilters, isNavigating };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

function Dropdown({
  label,
  icon,
  items,
  value,
  onSelect,
}: {
  label: string;
  icon?: ReactNode;
  items: { label: string; value: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm transition hover:border-teal-200 hover:text-teal-700"
        type="button"
        onClick={() => setOpen((next) => !next)}
      >
        {label}
        {icon ?? <ChevronDown size={14} />}
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-30 grid min-w-36 gap-1 rounded-xl border border-slate-200 bg-white p-2 text-sm font-black shadow-lg">
          {items.map((item) => (
            <button
              key={item.value}
              className={cn("rounded-lg px-3 py-2 text-left", value === item.value ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50")}
              type="button"
              onClick={() => {
                onSelect(item.value);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CreatorTrendHeaderFilters() {
  const { filters, directions, currentDirection, setFilters, isNavigating } = useFilters();
  const router = useRouter();
  const { range, platform, scenario, direction } = filters;

  useEffect(() => {
    const base = { range, platform, scenario, direction, keyword: "" as const };
    for (const directionOption of directions) {
      if (directionOption.slug === direction) continue;
      void router.prefetch(buildUrl({ ...base, direction: directionOption.slug }));
    }
  }, [directions, direction, platform, range, scenario, router]);

  return (
    <div className="flex flex-wrap items-center gap-3" aria-busy={isNavigating}>
      <Dropdown
        icon={<CalendarDays size={14} />}
        items={rangeFilters}
        label={rangeFilters.find((item) => item.value === filters.range)?.label ?? "近7天"}
        value={filters.range}
        onSelect={(value) => setFilters({ range: value as TrendRange }, "", { navigate: false })}
      />
      <Dropdown
        items={platformFilters}
        label={platformFilters.find((item) => item.value === filters.platform)?.label ?? "全部"}
        value={filters.platform}
        onSelect={(value) => setFilters({ platform: value as TrendPlatform }, "#hot-topics", { navigate: false })}
      />
      <Dropdown
        items={directions.map((item) => ({ label: item.label, value: item.slug }))}
        label={currentDirection.label}
        value={filters.direction}
        onSelect={(value) => setFilters({ direction: value, keyword: "" })}
      />
      <Dropdown
        items={scenarioFilters}
        label={scenarioFilters.find((item) => item.value === filters.scenario)?.label ?? "达人运营"}
        value={filters.scenario}
        onSelect={(value) => setFilters({ scenario: value }, "", { navigate: false })}
      />
    </div>
  );
}

export function CreatorTrendSearch() {
  const { filters, currentDirection, setFilters } = useFilters();
  const [draft, setDraft] = useState(filters.keyword);
  const [moreOpen, setMoreOpen] = useState(false);
  const chips = currentDirection.chips.length > 0 ? currentDirection.chips : ["美妆", "穿搭", "母婴", "职场", "AI工具", "生活方式"];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ keyword: draft.trim() }, "#hot-topics", { navigate: false });
  }

  return (
    <section className="flex flex-wrap items-center gap-4">
      <form className="flex h-12 min-w-[26rem] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm" onSubmit={submit}>
        <Search className="text-slate-400" size={20} />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
          placeholder="搜索热点 / 选题 / 关键词 / 对标账号"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black text-white" type="submit">
          搜索
        </button>
      </form>
      <div className="flex flex-wrap gap-3">
        {chips.map((chip, index) =>
          chip === "更多" ? (
            <div key={chip} className="relative">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
                type="button"
                onClick={() => setMoreOpen((next) => !next)}
              >
                更多
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-12 z-20 flex min-w-80 flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  {moreKeywordChips.map((item) => (
                    <button
                      key={item}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:border-teal-200 hover:text-teal-700"
                      type="button"
                      onClick={() => {
                        setDraft(item);
                        setFilters({ keyword: item }, "#hot-topics", { navigate: false });
                        setMoreOpen(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <button
              key={chip}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-black shadow-sm transition hover:border-teal-200 hover:text-teal-700",
                filters.keyword === chip || (!filters.keyword && index === 0) ? "border-teal-600 bg-teal-600 text-white hover:text-white" : "border-slate-200 bg-white text-slate-700",
              )}
              type="button"
              onClick={() => {
                setDraft(chip);
                setFilters({ keyword: chip }, "#hot-topics", { navigate: false });
              }}
            >
              {chip}
            </button>
          ),
        )}
      </div>
    </section>
  );
}

function SourceBadge({ kind }: { kind: SourceKind }) {
  const style =
    kind === "真实采集"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : kind === "规则计算"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-slate-200 bg-slate-50 text-slate-500";
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", style)}>{kind}</span>;
}

function PlatformBadge({ label }: { label: string }) {
  const map: Record<string, string> = {
    小红书: "bg-red-500 text-white",
    抖音: "bg-stone-950 text-white",
    B站: "bg-pink-500 text-white",
    视频号: "bg-orange-400 text-white",
    微博: "bg-amber-400 text-white",
  };
  return <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[0.62rem] font-black", map[label] ?? "bg-stone-100 text-stone-700")}>{label.slice(0, 2)}</span>;
}

function stageClass(stage: TopicRow["stage"]) {
  if (stage === "爆发中") return "border-red-100 bg-red-50 text-red-600";
  if (stage === "长尾可做") return "border-orange-100 bg-orange-50 text-orange-600";
  return "border-amber-100 bg-amber-50 text-amber-600";
}

function adviceClass(advice: TopicRow["advice"]) {
  if (advice === "立即跟进") return "border-teal-200 bg-teal-50 text-teal-700";
  if (advice === "可长期做") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
}

export function CreatorTrendHotTopics({
  trendData,
  topicRows,
  trendSource,
  topicSource,
}: {
  trendData: CreatorTrendPoint[];
  topicRows: TopicRow[];
  trendSource: SourceKind;
  topicSource: SourceKind;
}) {
  const { filters, currentDirection, setFilters } = useFilters();
  const [localRange, setLocalRange] = useState<TrendRange>(filters.range);
  const [localPlatform, setLocalPlatform] = useState<TrendPlatform>(filters.platform);
  const rangeDays = rangeFilters.find((item) => item.value === localRange)?.days ?? 7;
  const displayTrendData = trendData.slice(-Math.min(trendData.length, localRange === "24h" ? 2 : rangeDays));
  const filteredRows = topicRows
    .filter((row, index, rows) => rows.findIndex((candidate) => `${candidate.topic}-${candidate.platforms.join(",")}` === `${row.topic}-${row.platforms.join(",")}`) === index)
    .filter((row) => localPlatform === "all" || row.platforms.includes(platformName[localPlatform]))
    .filter((row) => !filters.keyword || row.topic.includes(filters.keyword) || row.source?.includes(filters.keyword))
    .sort((a, b) => Number.parseInt(b.match, 10) - Number.parseInt(a.match, 10))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return (
    <section id="hot-topics" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">适合我的热点趋势</h2>
            <SourceBadge kind={trendSource} />
          </div>
          <div className="flex rounded-lg border border-slate-200 text-sm font-black">
            {rangeFilters.map((item) => (
              <button key={item.value} className={cn("px-4 py-2", localRange === item.value && "bg-blue-50 text-blue-600")} type="button" onClick={() => setLocalRange(item.value)}>
                {item.label === "近7天" ? "7天" : item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-2 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
          {[
            ["#0f9488", currentDirection.creatorTrendLabels[0]],
            ["#2563eb", currentDirection.creatorTrendLabels[1]],
            ["#f59e0b", currentDirection.creatorTrendLabels[2]],
            ["#8b5cf6", currentDirection.creatorTrendLabels[3]],
          ].map(([color, label]) => (
            <span key={label}><i className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>
          ))}
        </div>
        <CreatorTrendChart data={displayTrendData} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">热点匹配度排行</h2>
            <SourceBadge kind={topicSource} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black">
            {platformFilters.map((item) => (
              <button
                key={item.value}
                className={cn(
                  "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border px-3 py-1.5 leading-none transition",
                  localPlatform === item.value ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-500 hover:text-slate-800",
                )}
                type="button"
                onClick={() => setLocalPlatform(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-80 overflow-auto pr-1">
          <table className="min-w-[48rem] w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs text-slate-500">
              <tr>{["排名", "话题", "来源", "热度", "匹配度", "竞争度", "创作难度", "主要平台", "建议"].map((head) => <th key={head} className="px-3 py-3 font-black">{head}</th>)}</tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.rank}-${row.topic}`} className="border-b border-slate-100">
                  <td className="px-3 py-3"><span className="inline-flex size-6 items-center justify-center rounded-md bg-amber-500 text-xs font-black text-white">{row.rank}</span></td>
                  <td className="px-3 py-3 font-black">
                    <button className="transition hover:text-teal-700" type="button" onClick={() => setFilters({ keyword: row.topic }, "#topic-recommendations", { navigate: false })}>{row.topic}</button>
                    <span className={cn("ml-2 rounded-md border px-2 py-1 text-xs", stageClass(row.stage))}>{row.stage}</span>
                  </td>
                  <td className="min-w-[96px] px-3 py-3">
                    <span className="inline-flex h-7 items-center whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black leading-none text-slate-600">
                      {row.source ?? "综合热榜"}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-black">{row.heat}</td>
                  <td className="px-3 py-3 font-black text-teal-600">{row.match}</td>
                  <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">{row.competition}</span></td>
                  <td className="px-3 py-3"><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-600">{row.difficulty}</span></td>
                  <td className="px-3 py-3"><div className="flex gap-1">{row.platforms.map((platform) => <PlatformBadge key={platform} label={platform} />)}</div></td>
                  <td className="px-3 py-3">
                    <button className={cn("rounded-md border px-2 py-1 text-xs font-black", adviceClass(row.advice))} type="button" onClick={() => setFilters({ keyword: row.topic }, row.advice === "谨慎跟进" ? "#case-study" : "#topic-recommendations", { navigate: false })}>
                      {row.advice}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-sm font-semibold text-slate-400" colSpan={9}>
                    当前筛选暂无可展示热点，试试切换平台或清空关键词。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-400">同一榜单按平台筛选；抖音来自 TikHub 抖音热榜/热搜/创作者热点接口，小红书来自 TikHub 热榜、热搜词、创作灵感和笔记样本。</p>
      </div>
    </section>
  );
}
