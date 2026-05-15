"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Filter,
  Grid2X2,
  List,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MarketplaceTask = {
  id: string;
  title: string;
  campaignTitle: string;
  brandName: string;
  platform: string;
  contentType: string;
  industry: string;
  brief: string;
  rewardAmount: number;
  remainingSlots: number;
  totalSlots: number;
  minimumFollowers: number;
  deadline: string;
  daysLeft: number | null;
  matchScore: number;
  tags: string[];
  isRecommended: boolean;
  requiresDraftReview: boolean;
  allowUnverifiedSocialAccounts: boolean;
  href: string;
};

type MarketplaceStats = {
  available: number;
  estimatedIncome: number;
  weeklyNew: number;
  endingSoon: number;
};

type MarketplaceFilters = {
  platform?: string;
  country?: string;
  industry?: string;
  minReward?: string;
  q?: string;
  tab?: string;
};

type FilterOptions = {
  platforms: readonly string[];
  countries: readonly string[];
  industries: readonly string[];
};

type ViewMode = "card" | "list";

const tabs = [
  { value: "all", label: "全部任务" },
  { value: "recommended", label: "推荐任务", badge: "推荐" },
  { value: "highReward", label: "高佣金" },
  { value: "ending", label: "即将截止" },
  { value: "new", label: "新发布" },
];

function currency(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

function tabHref(value: string, filters: MarketplaceFilters) {
  const params = new URLSearchParams();
  Object.entries({ ...filters, tab: value }).forEach(([key, entry]) => {
    if (entry) params.set(key, entry);
  });
  return `/creator/marketplace?${params.toString()}`;
}

function platformTone(platform: string) {
  if (platform.includes("小红书")) return "bg-red-50 text-red-700 border-red-100";
  if (platform.includes("视频")) return "bg-orange-50 text-orange-700 border-orange-100";
  return "bg-stone-950 text-white border-stone-950";
}

function quotaPercent(task: MarketplaceTask) {
  if (task.totalSlots <= 0) return 0;
  return Math.max(0, Math.min(100, (task.remainingSlots / task.totalSlots) * 100));
}

function EmptyTasks() {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-10 text-center">
      <p className="text-lg font-black text-stone-950">暂无匹配任务</p>
      <p className="mt-2 text-sm text-stone-500">调整筛选条件，或者切换到全部任务继续浏览。</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex min-h-24 min-w-0 items-center gap-4 border-b border-stone-200/80 bg-white/76 px-5 py-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <p className="mt-1 text-2xl font-black tracking-tight text-stone-950">{value}</p>
        {sub ? <p className="mt-1 text-xs text-stone-400">{sub}</p> : null}
      </div>
      <ChevronRight className="ml-auto hidden h-4 w-4 text-stone-300 lg:block" />
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  return (
    <div className="inline-flex w-fit max-w-full rounded-lg border border-stone-200 bg-white p-1 shadow-sm" aria-label="任务视图切换">
      <button
        aria-pressed={value === "card"}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-black transition",
          value === "card" ? "bg-stone-950 text-white" : "text-stone-500 hover:bg-stone-50 hover:text-stone-950",
        )}
        onClick={() => onChange("card")}
        title="卡片视图"
        type="button"
      >
        <Grid2X2 className="h-4 w-4" />
        <span className="hidden sm:inline">卡片</span>
      </button>
      <button
        aria-pressed={value === "list"}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-black transition",
          value === "list" ? "bg-stone-950 text-white" : "text-stone-500 hover:bg-stone-50 hover:text-stone-950",
        )}
        onClick={() => onChange("list")}
        title="列表视图"
        type="button"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">列表</span>
      </button>
    </div>
  );
}

function TaskCard({ task }: { task: MarketplaceTask }) {
  return (
    <article className="group flex min-h-[19rem] min-w-0 flex-col rounded-lg border border-stone-200 bg-white/88 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black", platformTone(task.platform))}>
          {task.platform}
        </span>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tight text-amber-700">{currency(task.rewardAmount)}</p>
          <p className="text-xs font-semibold text-stone-500">固定奖励</p>
        </div>
      </div>

      <div className="mt-4 min-w-0">
        <h2 className="line-clamp-1 text-lg font-black tracking-tight text-stone-950">{task.title}</h2>
        <p className="mt-1 truncate text-sm text-stone-500">{task.brandName} · {task.campaignTitle}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-stone-100 border-y border-stone-100 py-3 text-sm">
        <div className="pr-3">
          <p className="text-xs text-stone-400">剩余额度</p>
          <p className="mt-1 font-black text-stone-950">{task.remainingSlots}</p>
        </div>
        <div className="px-3">
          <p className="text-xs text-stone-400">最低粉丝</p>
          <p className="mt-1 font-black text-stone-950">{compactNumber(task.minimumFollowers)}</p>
        </div>
        <div className="pl-3">
          <p className="text-xs text-stone-400">截止时间</p>
          <p className="mt-1 font-black text-stone-950">{shortDate(task.deadline)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {task.tags.slice(0, 4).map((tag) => (
          <span className="rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-600" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-800">
        需使用已认证社媒账号申请，商家通过后进入创作或发布流程。
      </div>

      <Link
        className="mt-auto inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-black text-stone-950 transition hover:bg-amber-300"
        href={task.href}
      >
        查看任务
      </Link>
    </article>
  );
}

function TaskGrid({ tasks }: { tasks: MarketplaceTask[] }) {
  if (tasks.length === 0) return <EmptyTasks />;
  return (
    <div className="grid min-w-0 max-w-full gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

function TaskTable({ tasks }: { tasks: MarketplaceTask[] }) {
  if (tasks.length === 0) return <EmptyTasks />;
  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-stone-200 bg-white/88 shadow-sm">
      <div className="w-full max-w-full overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="text-horizontal whitespace-nowrap px-4 py-3 font-black">任务</th>
              <th className="text-horizontal whitespace-nowrap px-4 py-3 font-black">平台</th>
              <th className="text-horizontal whitespace-nowrap px-4 py-3 font-black">奖励</th>
              <th className="text-horizontal whitespace-nowrap px-4 py-3 font-black">剩余额度</th>
              <th className="text-horizontal whitespace-nowrap px-4 py-3 font-black">粉丝要求</th>
              <th className="text-horizontal whitespace-nowrap px-4 py-3 font-black">截止时间</th>
              <th className="text-horizontal whitespace-nowrap px-4 py-3 font-black">适配度</th>
              <th className="text-horizontal whitespace-nowrap px-4 py-3 text-right font-black">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {tasks.map((task, index) => (
              <tr className={cn("align-middle transition hover:bg-amber-50/40", index === 0 && task.isRecommended ? "bg-amber-50/55" : "")} key={task.id}>
                <td className="px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {index === 0 && task.isRecommended ? <Sparkles className="h-4 w-4 shrink-0 text-amber-500" /> : null}
                    <div className="min-w-0">
                      <p className="line-clamp-2 font-black text-stone-950">{task.title}</p>
                      <p className="mt-1 text-xs text-stone-500">{task.brandName} · {task.industry}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={cn("inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-black", platformTone(task.platform))}>{task.platform}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-black text-amber-700">{currency(task.rewardAmount)}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="w-32">
                    <div className="flex justify-between text-xs text-stone-500">
                      <span>{task.remainingSlots} / {task.totalSlots}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-stone-200">
                      <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${quotaPercent(task)}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-stone-700">≥ {compactNumber(task.minimumFollowers)}</td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-stone-800">{shortDate(task.deadline)}</p>
                  <p className={cn("mt-1 text-xs", task.daysLeft !== null && task.daysLeft <= 7 ? "text-orange-600" : "text-stone-400")}>
                    {task.daysLeft === null ? "未设置" : `剩余${task.daysLeft}天`}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span className={cn("rounded-md border px-2.5 py-1 font-black", task.matchScore >= 80 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                    {task.matchScore}%
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2 whitespace-nowrap">
                    <Link className="rounded-lg border border-stone-200 bg-white px-4 py-2 font-black text-stone-800 hover:bg-stone-50" href={task.href}>
                      查看
                    </Link>
                    <Link className="rounded-lg bg-stone-950 px-4 py-2 font-black text-white hover:bg-stone-800" href={task.href}>
                      申请
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecommendationPanel({ tasks, walletAvailable }: { tasks: MarketplaceTask[]; walletAvailable: number }) {
  const featured = tasks.find((task) => task.isRecommended) ?? tasks[0];
  return (
    <aside className="grid min-w-0 gap-4 lg:sticky lg:top-24">
      <div className="rounded-lg border border-stone-200 bg-white/82 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="font-black text-stone-950">今日推荐</p>
        </div>
        {featured ? (
          <>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-amber-400 bg-amber-50 text-center">
                <p className="text-xl font-black text-stone-950">{featured.matchScore}%</p>
                <p className="text-[0.65rem] font-bold text-stone-500">适配度</p>
              </div>
              <div>
                <p className="font-black text-stone-950">{featured.title}</p>
                <p className="mt-1 truncate text-sm text-stone-500">{featured.brandName} · {currency(featured.rewardAmount)}</p>
                <Link className="mt-3 inline-flex items-center gap-1 text-sm font-black text-amber-700" href={featured.href}>
                  查看推荐 <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-stone-600">
              {["账号粉丝量符合任务要求", "内容领域与品牌受众高度契合", "近期种草内容表现优异", "历史合作履约率稳定"].map((reason) => (
                <p className="flex items-center gap-2" key={reason}>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  {reason}
                </p>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-stone-500">暂无可推荐任务。</p>
        )}
      </div>

      <div className="rounded-lg border border-stone-200 bg-white/82 p-5 shadow-sm">
        <p className="font-black text-stone-950">为你精选</p>
        <div className="mt-4 grid gap-3">
          {tasks.slice(0, 3).map((task) => (
            <Link className="rounded-lg border border-stone-200 bg-white p-3 transition hover:border-amber-200 hover:bg-amber-50/40" href={task.href} key={task.id}>
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div>
                  <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[0.65rem] font-black", platformTone(task.platform))}>{task.platform}</span>
                  <p className="mt-2 text-sm font-black text-stone-950">{task.title}</p>
                  <p className="mt-1 text-xs text-stone-500">剩余 {task.remainingSlots} · 截止 {shortDate(task.deadline)}</p>
                </div>
                <p className="font-black text-amber-700">{currency(task.rewardAmount)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white/82 p-5 shadow-sm">
        <p className="font-black text-stone-950">收益提醒</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-stone-500">可提现</p>
            <p className="mt-1 text-lg font-black text-stone-950">{currency(walletAvailable)}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-amber-700">建议优先</p>
            <p className="mt-1 text-lg font-black text-stone-950">高适配</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function CreatorMarketplaceExperience({
  currentFilters,
  filterOptions,
  stats,
  tasks,
  walletAvailable,
}: {
  currentFilters: MarketplaceFilters;
  filterOptions: FilterOptions;
  stats: MarketplaceStats;
  tasks: MarketplaceTask[];
  walletAvailable: number;
}) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "card";
    const saved = window.localStorage.getItem("creator-marketplace-view");
    return saved === "card" || saved === "list" ? saved : "card";
  });

  function setViewMode(nextMode: ViewMode) {
    setViewModeState(nextMode);
    window.localStorage.setItem("creator-marketplace-view", nextMode);
  }

  const topTasks = useMemo(() => tasks.slice(0, 6), [tasks]);

  return (
    <div className="grid min-w-0 max-w-full gap-5">
      <section className="flex min-w-0 max-w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-950">任务大厅</h1>
          <p className="mt-2 text-sm text-stone-500">海量品牌合作任务，找到适合你账号的优质机会</p>
        </div>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </section>

      <section className="grid w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-stone-200 bg-white/72 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<BadgeCheck className="h-6 w-6" />} label="可接任务" value={stats.available} />
        <StatCard icon={<CircleDollarSign className="h-6 w-6" />} label="预计收益" value={currency(stats.estimatedIncome)} />
        <StatCard icon={<Target className="h-6 w-6" />} label="本周新增" value={stats.weeklyNew} />
        <StatCard icon={<CalendarClock className="h-6 w-6" />} label="即将截止" value={stats.endingSoon} />
      </section>

      <form className="grid w-full min-w-0 max-w-full gap-3 rounded-lg border border-stone-200 bg-white/80 p-4 shadow-sm xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]" action="/creator/marketplace">
        <label className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            className="h-11 w-full rounded-lg border border-stone-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
            defaultValue={currentFilters.q ?? ""}
            name="q"
            placeholder="搜索任务 / 品牌 / 关键词"
          />
        </label>
        <select className="h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100" name="platform" defaultValue={currentFilters.platform ?? ""}>
          <option value="">全部平台</option>
          {filterOptions.platforms.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100" name="country" defaultValue={currentFilters.country ?? ""}>
          <option value="">全部地区</option>
          {filterOptions.countries.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100" name="industry" defaultValue={currentFilters.industry ?? ""}>
          <option value="">全部分类</option>
          {filterOptions.industries.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="h-11 w-full min-w-0 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-100" name="minReward" defaultValue={currentFilters.minReward ?? ""}>
          <option value="">奖励区间</option>
          <option value="30">≥ ¥30</option>
          <option value="50">≥ ¥50</option>
          <option value="80">≥ ¥80</option>
          <option value="120">≥ ¥120</option>
        </select>
        <input name="tab" type="hidden" value={currentFilters.tab ?? "all"} />
        <button className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 text-sm font-black text-white hover:bg-stone-800" type="submit">
          <Filter className="h-4 w-4" />
          筛选
        </button>
        <Link className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg px-4 text-sm font-black text-stone-500 hover:bg-stone-50 hover:text-stone-950" href="/creator/marketplace">
          重置
        </Link>
      </form>

      <section className="flex min-w-0 max-w-full flex-col gap-3 rounded-lg border border-stone-200 bg-white/70 px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const active = (currentFilters.tab ?? "all") === tab.value;
            return (
              <Link
                className={cn(
                  "relative inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap text-sm font-black transition",
                  active ? "text-stone-950 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-amber-500" : "text-stone-500 hover:text-stone-950",
                )}
                href={tabHref(tab.value, currentFilters)}
                key={tab.value}
              >
                {tab.label}
                {tab.badge ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] text-amber-700">{tab.badge}</span> : null}
              </Link>
            );
          })}
        </div>
        <div className="flex min-w-0 items-center gap-3 text-sm text-stone-500">
          <Users className="h-4 w-4" />
          共 {tasks.length} 条匹配任务
        </div>
      </section>

      {viewMode === "card" ? (
        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
          <TaskGrid tasks={topTasks} />
          <RecommendationPanel tasks={tasks} walletAvailable={walletAvailable} />
        </section>
      ) : (
        <TaskTable tasks={tasks} />
      )}

      <p className="text-xs leading-relaxed text-stone-500">
        温馨提示：请仔细阅读任务要求与合作条款，按要求完成内容创作，避免因违规导致任务取消或账号受限。
      </p>
    </div>
  );
}
