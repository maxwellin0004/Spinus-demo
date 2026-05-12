import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AlertTriangle, BarChart3, CalendarDays, ChevronDown, FileText, Gem, HeartPulse, Megaphone, Search, ShieldAlert, Sparkles, TrendingUp, UsersRound } from "lucide-react";
import { BrandInsightChart, type BrandInsightPoint } from "@/components/brand-insight-chart";
import { requireRole } from "@/lib/auth";
import { getBrandInsightAnalysis } from "@/lib/insights/analysis-queries";
import { getInsightDirection } from "@/lib/insights/directions";
import { getBrandCompetitors, getKeywordTrendSeries } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

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

const trendData: BrandInsightPoint[] = [
  { date: "05-17", brand: 28, category: 52, competitor: 38, sellingPoint: 18 },
  { date: "05-18", brand: 34, category: 58, competitor: 42, sellingPoint: 23 },
  { date: "05-19", brand: 41, category: 65, competitor: 49, sellingPoint: 28 },
  { date: "05-20", brand: 48, category: 71, competitor: 56, sellingPoint: 35 },
  { date: "05-21", brand: 45, category: 68, competitor: 62, sellingPoint: 42 },
  { date: "05-22", brand: 57, category: 76, competitor: 68, sellingPoint: 46 },
  { date: "05-23", brand: 63, category: 83, competitor: 66, sellingPoint: 52 },
  { date: "05-24", brand: 72, category: 89, competitor: 74, sellingPoint: 58 },
];

const metricCards = [
  { label: "品牌声量", value: "128.6万", sub: "近30天", delta: "+采集", icon: Megaphone, color: "from-teal-500 to-emerald-600", line: "teal" },
  { label: "互动总量", value: "42.3万", sub: "近30天", delta: "+真实", icon: HeartPulse, color: "from-blue-500 to-sky-500", line: "blue" },
  { label: "正面情绪", value: "68.7%", sub: "评论样本", delta: "+计算", icon: Gem, color: "from-amber-400 to-orange-500", line: "amber" },
  { label: "负面预警", value: "5", sub: "风险样本", delta: "+监控", icon: ShieldAlert, color: "from-red-500 to-rose-500", line: "red" },
];

const fallbackCompetitors: CompetitorRow[] = [
  { rank: 1, name: "完美日记 Perfect Diary", voice: "86.5万", growth: "+32.1%", sentiment: "71%", dominantTopic: "底妆测评", platforms: ["小红书", "抖音", "B站"] },
  { rank: 2, name: "花西子 Florasis", voice: "72.4万", growth: "+18.7%", sentiment: "64%", dominantTopic: "国风妆容", platforms: ["小红书", "抖音"] },
  { rank: 3, name: "橘朵 Judydoll", voice: "58.1万", growth: "+14.5%", sentiment: "69%", dominantTopic: "平价彩妆", platforms: ["小红书", "B站"] },
  { rank: 4, name: "珂拉琪 Colorkey", voice: "36.7万", growth: "+9.2%", sentiment: "62%", dominantTopic: "唇釉色号", platforms: ["小红书", "视频号"] },
];

const fallbackPainPoints: PainPoint[] = [
  { keyword: "搓泥", mentions: "2,451", sentiment: "负面", sample: "叠加防晒和底妆后容易起屑，是评论区最高频顾虑。" },
  { keyword: "泛白", mentions: "1,936", sentiment: "负面", sample: "黄皮用户反馈明显，适合做肤色实测内容。" },
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
  { level: "中", title: "竞品底妆测评爆发", detail: "完美日记相关内容连续 3 天进入高互动样本池。" },
  { level: "低", title: "学生党价格讨论增加", detail: "价格敏感内容有长尾机会，可考虑低门槛套组。" },
];

const keywordBubbles = ["防晒", "通勤", "敏感肌", "不卡粉", "泛白", "持妆", "油皮", "成分安全", "平价替代", "学生党", "新品", "包装设计"];
const navItems = [
  { label: "总览", href: "#overview" },
  { label: "关键词趋势", href: "#keyword-trend" },
  { label: "竞品分析", href: "#competitors" },
  { label: "用户洞察", href: "#user-insights" },
  { label: "投放机会", href: "#opportunities" },
  { label: "报告中心", href: "/brand/campaigns" },
];
const fallbackChips = ["美妆个护", "防晒", "底妆", "敏感肌", "学生党", "更多"];
const cardClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";
type SourceKind = "真实采集" | "规则计算" | "示例兜底";

function MiniSparkline({ color }: { color: string }) {
  const stroke = color === "teal" ? "#0f9488" : color === "blue" ? "#2563eb" : color === "amber" ? "#f59e0b" : "#ef4444";
  return (
    <svg aria-hidden className="h-12 w-full" viewBox="0 0 144 48">
      <path d="M3 34 C16 30 18 20 30 25 C43 30 43 12 56 16 C69 20 72 33 84 21 C97 9 101 27 113 18 C126 10 130 14 140 8" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2.6" />
    </svg>
  );
}

function PlatformBadge({ label }: { label: string }) {
  const map: Record<string, string> = {
    小红书: "bg-red-500 text-white",
    抖音: "bg-stone-950 text-white",
    B站: "bg-pink-500 text-white",
    视频号: "bg-orange-400 text-white",
    微博: "bg-amber-400 text-white",
  };
  return <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[0.62rem] font-black", map[label] ?? "bg-slate-100 text-slate-700")}>{label.slice(0, 2)}</span>;
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

export default async function BrandInsightsPage() {
  const session = await requireRole(UserRole.BRAND);

  const [brandPreference, competitorRows, recentContents, realTrendData, analysis] = await Promise.all([
    prisma.brandProfile.findUnique({
      where: { userId: session.userId },
      select: { insightDirection: true },
    }),
    getBrandCompetitors(),
    prisma.insightContent.findMany({
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 40,
    }),
    getKeywordTrendSeries(30),
    getBrandInsightAnalysis(),
  ]);
  const currentDirection = getInsightDirection(brandPreference?.insightDirection);
  const chips = currentDirection.chips.length > 0 ? currentDirection.chips : fallbackChips;

  const hasComments = analysis.comments.length > 0;
  const displayTrendData = realTrendData.length >= 2 ? realTrendData : trendData;
  const trendSource: SourceKind = realTrendData.length >= 2 ? "真实采集" : "示例兜底";
  const competitorSource: SourceKind = competitorRows.length > 0 ? "真实采集" : "示例兜底";
  const painSource: SourceKind = analysis.painPoints.length > 0 ? "规则计算" : "示例兜底";
  const opportunitySource: SourceKind = analysis.recommendations.length > 0 ? "规则计算" : "示例兜底";
  const alertSource: SourceKind = analysis.risks.length > 0 ? "规则计算" : "示例兜底";
  const sentimentSource: SourceKind = hasComments ? "规则计算" : "示例兜底";
  const displayMetrics = metricCards.map((card) => {
    if (card.label === "品牌声量") return { ...card, value: formatCompact(analysis.metrics.voiceCount), delta: analysis.metrics.voiceCount > 0 ? "+采集" : "待采集" };
    if (card.label === "互动总量") return { ...card, value: formatCompact(analysis.metrics.interactionCount), delta: analysis.metrics.interactionCount > 0 ? "+真实" : "待采集" };
    if (card.label === "正面情绪") return { ...card, value: hasComments ? `${Math.round(analysis.metrics.positiveRate * 100)}%` : "待分析", delta: hasComments ? "+计算" : "待评论" };
    return { ...card, value: String(analysis.metrics.negativeAlerts), delta: hasComments ? "+监控" : "待评论" };
  });

  const realCompetitors: CompetitorRow[] = competitorRows.slice(0, 5).map((row) => {
    const keyword = row.keyword ?? "未标注";
    const platforms = Array.from(new Set(recentContents.filter((item) => item.keyword === row.keyword).map((item) => platformLabel(item.platform))));
    return {
      rank: row.rank,
      name: keyword,
      voice: formatCompact(row.voiceCount),
      growth: row.interactions > 0 ? "+采集" : "0%",
      sentiment: hasComments ? `${Math.round(analysis.metrics.positiveRate * 100)}%` : "待分析",
      dominantTopic: keyword,
      platforms: platforms.length > 0 ? platforms : ["小红书"],
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
  const realKeywordBubbles =
    recentContents.length > 0
      ? Array.from(new Set([...recentContents.map((item) => item.keyword).filter((keyword): keyword is string => Boolean(keyword)), ...keywordBubbles])).slice(0, 12)
      : keywordBubbles;

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
            <div className="flex flex-wrap items-center gap-3">
              {["近30天", "全部平台", currentDirection.label, "品牌运营团队"].map((item) => (
                <Link key={item} href={`/brand/insights?filter=${encodeURIComponent(item)}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm transition hover:border-teal-200 hover:text-teal-700">
                  {item}
                  {item === "近30天" ? <CalendarDays size={14} /> : <ChevronDown size={14} />}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="space-y-5 p-8">
          <section className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 min-w-[26rem] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search className="text-slate-400" size={20} />
              <span className="text-sm font-semibold text-slate-400">搜索品牌 / 品类 / 竞品 / 关键词</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {chips.map((chip, index) => (
                <Link key={chip} href={`/brand/insights?keyword=${encodeURIComponent(chip)}`} className={cn("rounded-xl border px-4 py-2 text-sm font-black shadow-sm transition hover:border-teal-200 hover:text-teal-700", index === 0 ? "border-teal-600 bg-teal-600 text-white hover:text-white" : "border-slate-200 bg-white text-slate-700")}>{chip}</Link>
              ))}
            </div>
          </section>

          <section id="overview" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-4">
            {displayMetrics.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={cn(cardClass, "min-h-36 p-5")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn("flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm", card.color)}>
                        <Icon size={26} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-700">{card.label}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{card.sub}</p>
                      </div>
                    </div>
                    <div className="h-12 w-28 shrink-0">
                      <MiniSparkline color={card.line} />
                    </div>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="min-w-0 break-words text-4xl font-black leading-none tracking-tight">{card.value}</p>
                    <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-red-500">{card.delta}</span>
                  </div>
                </div>
              );
            })}
          </section>

          <section id="keyword-trend" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
            <div className={cn(cardClass, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">品牌相关内容热度走势</h2>
                  <SourceBadge kind={trendSource} />
                </div>
                <div className="flex rounded-lg border border-slate-200 text-sm font-black">
                  {["7天", "30天", "90天"].map((item, index) => <span key={item} className={cn("px-4 py-2", index === 1 && "bg-blue-50 text-blue-600")}>{item}</span>)}
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
                {[
                  ["#0f9488", currentDirection.brandTrendLabels[0]],
                  ["#2563eb", currentDirection.brandTrendLabels[1]],
                  ["#f59e0b", currentDirection.brandTrendLabels[2]],
                  ["#ef4444", currentDirection.brandTrendLabels[3]],
                ].map(([color, label]) => (
                  <span key={label}><i className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>
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
                <Link href="#competitors" className="text-sm font-black text-blue-600 hover:text-blue-700">查看完整榜单 &gt;</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[43rem] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>{["排名", "热词/竞品", "内容样本数", "互动状态", "情绪状态", "主要讨论点", "来源平台"].map((head) => <th key={head} className="px-3 py-3 font-black">{head}</th>)}</tr>
                  </thead>
                  <tbody>
                    {displayCompetitors.map((row) => (
                      <tr key={`${row.rank}-${row.name}`} className="border-b border-slate-100">
                        <td className="px-3 py-3"><span className="inline-flex size-6 items-center justify-center rounded-md bg-amber-500 text-xs font-black text-white">{row.rank}</span></td>
                        <td className="px-3 py-3 font-black">{row.name}</td>
                        <td className="px-3 py-3 font-black">{row.voice}</td>
                        <td className="px-3 py-3 font-black text-red-500">{row.growth}</td>
                        <td className="px-3 py-3 font-black text-teal-600">{row.sentiment}</td>
                        <td className="px-3 py-3 font-bold">{row.dominantTopic}</td>
                        <td className="px-3 py-3"><div className="flex gap-1">{row.platforms.map((platform) => <PlatformBadge key={platform} label={platform} />)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-400">内容样本数来自已采集的公开笔记/视频；互动状态综合点赞、评论、收藏和转发估算。</p>
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
              <div className="mt-4 flex flex-wrap gap-2">{realKeywordBubbles.slice(0, 10).map((keyword) => <span key={keyword} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">{keyword}</span>)}</div>
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
                  <Link href="/brand/campaigns" className="rounded-xl bg-teal-600 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-teal-700"><FileText className="mr-2 inline" size={15} />生成报告</Link>
                  <Link href="/brand/campaigns/new" className="rounded-xl border border-teal-600 px-4 py-3 text-center text-sm font-black text-teal-700 transition hover:bg-teal-50">创建 Brief</Link>
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
                <Link href="/admin/insights" className="mt-4 block w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-black text-red-600 transition hover:bg-red-100">设置关键词监控</Link>
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
                    <p className="text-3xl font-black">{hasComments ? `${positivePercent}%` : "待分析"}</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm font-bold text-slate-600">
                  <p><span className="mr-2 inline-block size-2.5 rounded-full bg-teal-600" />正面 {hasComments ? `${positivePercent}%` : "待评论"}</p>
                  <p><span className="mr-2 inline-block size-2.5 rounded-full bg-slate-300" />中性 {hasComments ? `${neutralPercent}%` : "待评论"}</p>
                  <p><span className="mr-2 inline-block size-2.5 rounded-full bg-red-500" />负面 {hasComments ? `${negativePercent}%` : "待评论"}</p>
                </div>
              </div>
            </div>
            <div className={cn(cardClass, "p-5")}>
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={18} />
                <h2 className="text-xl font-black">数据字段结构</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {["内容样本", "评论样本", "分析结果"].map((title, index) => (
                  <div key={title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="font-black">{title}</p>
                    <p className="mt-2 text-sm text-slate-600">{index === 0 ? "标题、正文、作者、平台、互动量、发布时间。" : index === 1 ? "评论原文、点赞数、情绪、痛点、风险标签。" : "趋势、排行、机会、预警、情绪分布。"}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">当前优先读取 TikHub 采集入库数据；缺少样本的模块会回落到演示数据。</p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
