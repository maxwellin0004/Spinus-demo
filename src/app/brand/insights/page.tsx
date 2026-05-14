import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AlertTriangle, CalendarDays, FileText, Gem, HeartPulse, Megaphone, Search, ShieldAlert, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { BrandInsightChart, type BrandInsightPoint } from "@/components/brand-insight-chart";
import { requireRole } from "@/lib/auth";
import { getBrandInsightAnalysis } from "@/lib/insights/analysis-queries";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTIONS, getInsightDirection } from "@/lib/insights/directions";
import { getBrandCompetitors, getBrandInsightsOverview, getBrandRecentContents, getKeywordTrendSeries } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type SourceKind = "真实采集" | "规则计算" | "示例兜底";
type BrandPlatform = "all" | "xiaohongshu" | "douyin" | "weibo" | "bilibili";
type BrandRange = "7d" | "30d" | "90d";
type BrandInsightFilters = {
  range: BrandRange;
  platform: BrandPlatform;
  direction: string;
  keyword: string;
};

type CompetitorRow = {
  rank: number;
  name: string;
  voice: string;
  growth: string;
  sentiment: string;
  dominantTopic: string;
  platforms: string[];
};

type PainPoint = {
  keyword: string;
  mentions: string;
  sentiment: "正面" | "中性" | "负面";
  sample: string;
};

const brandRangeFilters = [
  { label: "近7天", value: "7d" as const, days: 7 },
  { label: "近30天", value: "30d" as const, days: 30 },
  { label: "近90天", value: "90d" as const, days: 90 },
];

const brandPlatformFilters = [
  { label: "全部平台", value: "all" as const },
  { label: "小红书", value: "xiaohongshu" as const },
  { label: "抖音", value: "douyin" as const },
  { label: "微博", value: "weibo" as const },
  { label: "B站", value: "bilibili" as const },
];

const trendDataFallback: BrandInsightPoint[] = [
  { date: "05-17", brand: 28, category: 52, competitor: 38, sellingPoint: 18 },
  { date: "05-18", brand: 34, category: 58, competitor: 42, sellingPoint: 23 },
  { date: "05-19", brand: 41, category: 65, competitor: 49, sellingPoint: 28 },
  { date: "05-20", brand: 48, category: 71, competitor: 56, sellingPoint: 35 },
  { date: "05-21", brand: 45, category: 68, competitor: 62, sellingPoint: 42 },
  { date: "05-22", brand: 57, category: 76, competitor: 68, sellingPoint: 46 },
  { date: "05-23", brand: 63, category: 83, competitor: 66, sellingPoint: 52 },
  { date: "05-24", brand: 72, category: 89, competitor: 74, sellingPoint: 58 },
];

const fallbackCompetitors: CompetitorRow[] = [
  { rank: 1, name: "完美日记", voice: "86.5万", growth: "+32.1%", sentiment: "71%", dominantTopic: "底妆测评", platforms: ["小红书", "抖音", "B站"] },
  { rank: 2, name: "花西子", voice: "72.4万", growth: "+18.7%", sentiment: "64%", dominantTopic: "国风妆容", platforms: ["小红书", "抖音"] },
  { rank: 3, name: "橘朵", voice: "58.1万", growth: "+14.5%", sentiment: "69%", dominantTopic: "平价彩妆", platforms: ["小红书", "B站"] },
  { rank: 4, name: "珂拉琪", voice: "36.7万", growth: "+9.2%", sentiment: "62%", dominantTopic: "唇釉色号", platforms: ["小红书", "抖音"] },
];

const fallbackPainPoints: PainPoint[] = [
  { keyword: "搓泥", mentions: "2,451", sentiment: "负面", sample: "叠加防晒和底妆后容易起屑，是评论区最高频顾虑。" },
  { keyword: "泛白", mentions: "1,936", sentiment: "负面", sample: "黄皮用户反馈明显，适合做不同肤色实测内容。" },
  { keyword: "持妆", mentions: "1,728", sentiment: "正面", sample: "通勤和夏季场景下讨论增长，可作为投放主卖点。" },
  { keyword: "成分安全", mentions: "1,382", sentiment: "中性", sample: "敏感肌用户会主动追问成分和适用人群。" },
];

const fallbackOpportunities = [
  { title: "通勤防晒实测", platform: "小红书优先", creator: "10-50 万粉实测达人", reason: "防晒词增长快，用户对搓泥和泛白有明确需求。" },
  { title: "敏感肌成分科普", platform: "B站 + 小红书", creator: "成分党 / 皮肤管理达人", reason: "成分安全讨论升温，适合建立专业可信度。" },
  { title: "平价替代对比", platform: "抖音优先", creator: "腰部彩妆达人", reason: "竞品在平价内容占位强，可用真实对比切入。" },
];

const fallbackAlerts = [
  { level: "高", title: "泛白负面词上升", detail: "近 24 小时提及增长 42%，集中在防晒和底妆叠加场景。" },
  { level: "中", title: "竞品底妆测评爆发", detail: "竞品相关内容连续 3 天进入高互动样本池。" },
  { level: "低", title: "学生党价格讨论增加", detail: "价格敏感内容有长尾机会，可考虑低门槛套组。" },
];

const fallbackKeywords = ["防晒", "通勤", "敏感肌", "不拔干", "泛白", "持妆", "油皮", "成分安全", "平价替代", "学生党", "新品", "包装设计"];

const navItems = [
  { label: "总览", href: "#overview" },
  { label: "关键词趋势", href: "#keyword-trend" },
  { label: "竞品分析", href: "#competitors" },
  { label: "用户洞察", href: "#user-insights" },
  { label: "投放机会", href: "#opportunities" },
  { label: "报告中心", href: "/brand/campaigns" },
];

const cardClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";

function normalizeBrandPlatform(value: string | undefined): BrandPlatform {
  return brandPlatformFilters.some((item) => item.value === value) ? (value as BrandPlatform) : "all";
}

function normalizeBrandRange(value: string | undefined): BrandRange {
  return brandRangeFilters.some((item) => item.value === value) ? (value as BrandRange) : "30d";
}

function normalizeBrandDirection(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return INSIGHT_DIRECTIONS.some((item) => item.slug === value) ? value : fallback;
}

function resolveRangeDays(range: BrandRange) {
  return brandRangeFilters.find((item) => item.value === range)?.days ?? 30;
}

function readLegacyBrandFilter(filter: string | undefined): Partial<BrandInsightFilters> {
  if (!filter) return {};
  if (filter === "近7天") return { range: "7d" };
  if (filter === "近30天") return { range: "30d" };
  if (filter === "近90天") return { range: "90d" };
  if (filter === "全部平台") return { platform: "all" };
  const platform = brandPlatformFilters.find((item) => item.label === filter);
  if (platform) return { platform: platform.value };
  const direction = INSIGHT_DIRECTIONS.find((item) => item.label === filter);
  if (direction) return { direction: direction.slug };
  return {};
}

function buildBrandInsightsHref(filters: BrandInsightFilters, patch: Partial<BrandInsightFilters>) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.range !== "30d") params.set("range", next.range);
  if (next.platform !== "all") params.set("platform", next.platform);
  if (next.direction !== DEFAULT_INSIGHT_DIRECTION) params.set("direction", next.direction);
  if (next.keyword.trim()) params.set("keyword", next.keyword.trim());
  const query = params.toString();
  return `/brand/insights${query ? `?${query}` : ""}`;
}

function platformLabel(platform: string) {
  const map: Record<string, string> = {
    douyin: "抖音",
    xiaohongshu: "小红书",
    bilibili: "B站",
    weibo: "微博",
  };
  return map[platform] ?? platform;
}

function formatCompact(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return value.toLocaleString();
}

function sentimentClass(sentiment: PainPoint["sentiment"]) {
  if (sentiment === "正面") return "border-teal-100 bg-teal-50 text-teal-700";
  if (sentiment === "负面") return "border-red-100 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-600";
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
    微博: "bg-amber-400 text-white",
  };
  return <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[0.62rem] font-black", map[label] ?? "bg-slate-100 text-slate-700")}>{label.slice(0, 2)}</span>;
}

export default async function BrandInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; range?: string; direction?: string; keyword?: string; filter?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const [params, brandPreference] = await Promise.all([
    searchParams,
    prisma.brandProfile.findUnique({
      where: { userId: session.userId },
      select: { insightDirection: true },
    }),
  ]);

  const legacyFilters = readLegacyBrandFilter(params.filter);
  const filters: BrandInsightFilters = {
    range: legacyFilters.range ?? normalizeBrandRange(params.range),
    platform: legacyFilters.platform ?? normalizeBrandPlatform(params.platform),
    direction: normalizeBrandDirection(legacyFilters.direction ?? params.direction, brandPreference?.insightDirection ?? DEFAULT_INSIGHT_DIRECTION),
    keyword: params.keyword?.trim() ?? legacyFilters.keyword ?? "",
  };
  const currentDirection = getInsightDirection(filters.direction);
  const days = resolveRangeDays(filters.range);

  const [overview, competitorRows, trendRows, analysis, recentContentsRaw] = await Promise.all([
    getBrandInsightsOverview({
      directionSlug: filters.direction,
      platform: filters.platform,
      keyword: filters.keyword,
      days,
    }),
    getBrandCompetitors({
      directionSlug: filters.direction,
      platform: filters.platform,
      keyword: filters.keyword,
      days,
    }),
    getKeywordTrendSeries(days, filters.direction, {
      platform: filters.platform,
      keyword: filters.keyword,
    }),
    getBrandInsightAnalysis({
      directionSlug: filters.direction,
      platform: filters.platform,
      keyword: filters.keyword,
      days,
    }),
    getBrandRecentContents(
      {
        directionSlug: filters.direction,
        platform: filters.platform,
        keyword: filters.keyword,
        days,
      },
      100,
    ),
  ]);

  const recentContents = recentContentsRaw;
  const chips = currentDirection.chips.length > 0 ? currentDirection.chips.filter((chip) => chip !== "更多") : ["美妆个护", "防晒", "底妆", "敏感肌", "学生党"];

  const trendSource: SourceKind = trendRows.length >= 2 ? "真实采集" : "示例兜底";
  const competitorSource: SourceKind = competitorRows.length > 0 ? "真实采集" : "示例兜底";
  const painSource: SourceKind = analysis.painPoints.length > 0 ? "规则计算" : "示例兜底";
  const opportunitySource: SourceKind = analysis.recommendations.length > 0 ? "规则计算" : "示例兜底";
  const alertSource: SourceKind = analysis.risks.length > 0 ? "规则计算" : "示例兜底";
  const sentimentSource: SourceKind = analysis.comments.length > 0 ? "规则计算" : "示例兜底";

  const displayTrendData = trendRows.length >= 2 ? trendRows : trendDataFallback;
  const displayMetrics = [
    { label: "品牌声量", value: formatCompact(overview.voiceCount), sub: `近${days}天`, delta: overview.voiceCount > 0 ? "+采集" : "待采集", icon: Megaphone, color: "from-teal-500 to-emerald-600" },
    { label: "互动总量", value: formatCompact(overview.interactionCount), sub: `近${days}天`, delta: overview.interactionCount > 0 ? "+真实" : "待采集", icon: HeartPulse, color: "from-blue-500 to-sky-500" },
    { label: "正面情绪", value: analysis.comments.length > 0 ? `${Math.round(overview.positiveRate * 100)}%` : "待分析", sub: "评论样本", delta: analysis.comments.length > 0 ? "+计算" : "待评论", icon: Gem, color: "from-amber-400 to-orange-500" },
    { label: "负面预警", value: String(overview.negativeAlerts), sub: "风险样本", delta: analysis.comments.length > 0 ? "+监控" : "待评论", icon: ShieldAlert, color: "from-red-500 to-rose-500" },
  ];

  const realCompetitors: CompetitorRow[] = competitorRows.slice(0, 6).map((row) => {
    const platforms = Array.from(new Set(recentContents.filter((item) => item.keyword === row.keyword).map((item) => platformLabel(item.platform))));
    return {
      rank: row.rank,
      name: row.keyword ?? "未标记",
      voice: formatCompact(row.voiceCount),
      growth: row.interactions > 0 ? "+采集" : "0%",
      sentiment: analysis.comments.length > 0 ? `${Math.round(overview.positiveRate * 100)}%` : "待分析",
      dominantTopic: row.keyword ?? "未标记",
      platforms: platforms.length > 0 ? platforms : [filters.platform === "all" ? "小红书" : platformLabel(filters.platform)],
    };
  });
  const displayCompetitors = realCompetitors.length > 0 ? realCompetitors : fallbackCompetitors;

  const displayPainPoints: PainPoint[] =
    analysis.painPoints.length > 0
      ? analysis.painPoints.slice(0, 4).map((item) => ({
          keyword: item.keyword,
          mentions: item.mentions.toLocaleString(),
          sentiment: item.sentiment,
          sample: item.sample,
        }))
      : fallbackPainPoints;
  const displayOpportunities = analysis.recommendations.length > 0 ? analysis.recommendations : fallbackOpportunities;
  const displayAlerts = analysis.risks.length > 0 ? analysis.risks : fallbackAlerts;

  const sentimentTotal = Math.max(1, analysis.comments.length);
  const positivePercent = Math.round((analysis.comments.filter((comment) => comment.sentiment === "正面").length / sentimentTotal) * 100);
  const neutralPercent = Math.round((analysis.comments.filter((comment) => comment.sentiment === "中性").length / sentimentTotal) * 100);
  const negativePercent = Math.max(0, 100 - positivePercent - neutralPercent);
  const keywordBubbles =
    recentContents.length > 0
      ? Array.from(new Set([...recentContents.map((item) => item.keyword).filter((item): item is string => Boolean(item)), ...fallbackKeywords])).slice(0, 12)
      : fallbackKeywords;

  return (
    <>
      <style>{`
        main:has(> [data-brand-insights-shell]) {
          max-width: none !important;
          padding: 0 !important;
        }
      `}</style>
      <div data-brand-insights-shell className="min-h-screen bg-[#f8fafc] text-slate-950">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 flex-wrap items-center gap-4 px-8">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm">
                <TrendingUp size={22} />
              </div>
              <p className="text-xl font-black tracking-tight">热点洞察台 | 品牌洞察版</p>
            </div>
            <nav className="flex flex-1 flex-wrap items-center gap-6 text-sm font-black text-slate-700">
              {navItems.map((item, index) => (
                <Link key={item.label} href={item.href} className={cn("py-6 transition hover:text-teal-700", index === 0 && "border-b-4 border-teal-600 text-teal-700")}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="space-y-5 p-8">
          <section className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 min-w-[22rem] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search className="text-slate-400" size={20} />
              <span className="text-sm font-semibold text-slate-400">{filters.keyword ? `关键词：${filters.keyword}` : "搜索品牌 / 品类 / 竞品 / 关键词"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {brandRangeFilters.map((item) => (
                <Link key={item.value} href={buildBrandInsightsHref(filters, { range: item.value })} className={cn("rounded-xl border px-4 py-2 text-sm font-black shadow-sm transition", filters.range === item.value ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-700")}>
                  <CalendarDays className="mr-1 inline" size={14} />
                  {item.label}
                </Link>
              ))}
              {brandPlatformFilters.map((item) => (
                <Link key={item.value} href={buildBrandInsightsHref(filters, { platform: item.value })} className={cn("rounded-xl border px-4 py-2 text-sm font-black shadow-sm transition", filters.platform === item.value ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-700")}>
                  {item.label}
                </Link>
              ))}
              <Link href={buildBrandInsightsHref(filters, { direction: DEFAULT_INSIGHT_DIRECTION })} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700">
                赛道：{currentDirection.label}
              </Link>
            </div>
          </section>

          <section className="flex flex-wrap gap-3">
            {chips.map((chip) => (
              <Link key={chip} href={buildBrandInsightsHref(filters, { keyword: chip })} className={cn("rounded-xl border px-4 py-2 text-sm font-black shadow-sm transition", filters.keyword === chip ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:text-teal-700")}>
                {chip}
              </Link>
            ))}
            {filters.keyword ? (
              <Link href={buildBrandInsightsHref(filters, { keyword: "" })} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700">
                清除关键词
              </Link>
            ) : null}
          </section>

          <section id="overview" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-4">
            {displayMetrics.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={cn(cardClass, "min-h-36 p-5")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm", card.color)}>
                      <Icon size={24} />
                    </div>
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-500">{card.delta}</span>
                  </div>
                  <p className="mt-4 text-sm font-black text-slate-700">{card.label}</p>
                  <p className="mt-1 text-4xl font-black tracking-tight">{card.value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{card.sub}</p>
                </div>
              );
            })}
          </section>

          <section id="keyword-trend" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
            <div className={cn(cardClass, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">品牌相关内容热度趋势</h2>
                  <SourceBadge kind={trendSource} />
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
                {[
                  ["#0f9488", currentDirection.brandTrendLabels[0]],
                  ["#2563eb", currentDirection.brandTrendLabels[1]],
                  ["#f59e0b", currentDirection.brandTrendLabels[2]],
                  ["#ef4444", currentDirection.brandTrendLabels[3]],
                ].map(([color, label]) => (
                  <span key={label}>
                    <i className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                ))}
              </div>
              <BrandInsightChart data={displayTrendData} />
            </div>

            <div id="competitors" className={cn(cardClass, "scroll-mt-28 overflow-hidden p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">高频热词与竞品讨论排行</h2>
                  <SourceBadge kind={competitorSource} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[43rem] text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      {["排名", "热词/竞品", "内容样本数", "互动状态", "情绪状态", "主要讨论点", "来源平台"].map((head) => (
                        <th key={head} className="px-3 py-3 font-black">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayCompetitors.map((row) => (
                      <tr key={`${row.rank}-${row.name}`} className="border-b border-slate-100">
                        <td className="px-3 py-3">
                          <span className="inline-flex size-6 items-center justify-center rounded-md bg-amber-500 text-xs font-black text-white">{row.rank}</span>
                        </td>
                        <td className="px-3 py-3 font-black">{row.name}</td>
                        <td className="px-3 py-3 font-black">{row.voice}</td>
                        <td className="px-3 py-3 font-black text-red-500">{row.growth}</td>
                        <td className="px-3 py-3 font-black text-teal-600">{row.sentiment}</td>
                        <td className="px-3 py-3 font-bold">{row.dominantTopic}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            {row.platforms.map((platform) => (
                              <PlatformBadge key={platform} label={platform} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="user-insights" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
            <div className={cn(cardClass, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">用户痛点与购买顾虑</h2>
                  <SourceBadge kind={painSource} />
                </div>
                <UsersRound className="text-slate-400" size={18} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {displayPainPoints.map((item) => (
                  <div key={item.keyword} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black">{item.keyword}</p>
                      <span className={cn("rounded-md border px-2 py-1 text-xs font-black", sentimentClass(item.sentiment))}>{item.sentiment}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-blue-700">提及 {item.mentions}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.sample}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {keywordBubbles.slice(0, 12).map((keyword) => (
                  <span key={keyword} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              <div id="opportunities" className={cn(cardClass, "scroll-mt-28 p-5")}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black">投放机会建议</h2>
                    <SourceBadge kind={opportunitySource} />
                  </div>
                  <Sparkles className="text-amber-500" size={18} />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {displayOpportunities.slice(0, 3).map((item) => (
                    <div key={item.title} className="min-w-[18rem] flex-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{item.title}</p>
                          <p className="mt-1 text-sm font-bold text-teal-700">{item.creator}</p>
                        </div>
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{item.platform}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.reason}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link href="/brand/campaigns" className="rounded-xl bg-teal-600 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-teal-700">
                    <FileText className="mr-2 inline" size={15} />
                    生成报告
                  </Link>
                  <Link href="/brand/campaigns/new" className="rounded-xl border border-teal-600 px-4 py-3 text-center text-sm font-black text-teal-700 transition hover:bg-teal-50">
                    创建 Brief
                  </Link>
                </div>
              </div>

              <div className={cn(cardClass, "p-5")}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black">风险预警</h2>
                    <SourceBadge kind={alertSource} />
                  </div>
                  <AlertTriangle className="text-red-500" size={18} />
                </div>
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  {displayAlerts.slice(0, 3).map((alert) => (
                    <div key={alert.title} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-md px-2 py-1 text-xs font-black", alert.level === "高" ? "bg-red-50 text-red-600" : alert.level === "中" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")}>{alert.level}</span>
                        <p className="font-black">{alert.title}</p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{alert.detail}</p>
                    </div>
                  ))}
                </div>
                <Link href="/admin/insights" className="mt-4 block w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-black text-red-600 transition hover:bg-red-100">
                  设置关键词监控
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1fr]">
            <div className={cn(cardClass, "p-5")}>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">情绪倾向分布</h2>
                <SourceBadge kind={sentimentSource} />
              </div>
              <div className="mt-4 grid grid-cols-[10rem_1fr] items-center gap-6">
                <div className="flex aspect-square items-center justify-center rounded-full border-[1.35rem] border-teal-600 bg-white shadow-inner">
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-500">正面</p>
                    <p className="text-3xl font-black">{analysis.comments.length > 0 ? `${positivePercent}%` : "待分析"}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm font-bold text-slate-600">
                  <p>
                    <span className="mr-2 inline-block size-2.5 rounded-full bg-teal-600" />
                    正面 {analysis.comments.length > 0 ? `${positivePercent}%` : "待评论"}
                  </p>
                  <p>
                    <span className="mr-2 inline-block size-2.5 rounded-full bg-slate-300" />
                    中性 {analysis.comments.length > 0 ? `${neutralPercent}%` : "待评论"}
                  </p>
                  <p>
                    <span className="mr-2 inline-block size-2.5 rounded-full bg-red-500" />
                    负面 {analysis.comments.length > 0 ? `${negativePercent}%` : "待评论"}
                  </p>
                </div>
              </div>
            </div>
            <div className={cn(cardClass, "p-5")}>
              <div className="mb-4 flex items-center gap-2">
                <Megaphone className="text-blue-600" size={18} />
                <h2 className="text-xl font-black">数据说明</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {["内容样本", "评论样本", "分析结果"].map((title, index) => (
                  <div key={title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="font-black">{title}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {index === 0
                        ? "标题、正文、作者、平台、互动量、发布时间。"
                        : index === 1
                        ? "评论原文、点赞数、情绪、痛点和风险标签。"
                        : "趋势、排行、机会、预警、情绪分布。"}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">当前优先读取 TikHub 采集入库数据；样本不足时会回退到示例数据，保证页面可用。</p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
