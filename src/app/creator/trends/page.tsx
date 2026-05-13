import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AlertTriangle, CalendarDays, ChevronDown, Copy, Flame, Lightbulb, RefreshCw, Search, Target } from "lucide-react";
import { CreatorTrendChart, type CreatorTrendPoint } from "@/components/creator-trend-chart";
import { requireRole } from "@/lib/auth";
import { getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";
import { getInsightDirection } from "@/lib/insights/directions";
import { getCreatorTopTopics, getCreatorTrendSeries, getCreatorTrendsOverview } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type TopicStage = "爆发中" | "长尾可做" | "谨慎追";
type Level = "低" | "中" | "高";

type TopicRow = {
  rank: number;
  topic: string;
  stage: TopicStage;
  heat: string;
  match: string;
  competition: Level;
  difficulty: Level;
  platforms: string[];
  advice: "立即跟" | "可长尾" | "谨慎跟";
};

type TopicCard = {
  title: string;
  stage: "爆发中" | "长尾可做";
  reason: string;
  tags: string[];
  heat: string;
  tone: string;
};

type CreatorTrendOverview = {
  trackableTopics: number;
  matchOpportunities: number;
  highPotential: number;
  overheated: number;
};

type CaseStudySnapshot = {
  title: string;
  likes: string;
  stats: string[];
  rows: [string, string][];
};

const trendData: CreatorTrendPoint[] = [
  { date: "05-17", skincare: 24, makeup: 18, ingredients: 8, tools: 4 },
  { date: "05-18", skincare: 44, makeup: 34, ingredients: 22, tools: 14 },
  { date: "05-19", skincare: 60, makeup: 44, ingredients: 27, tools: 18 },
  { date: "05-20", skincare: 70, makeup: 45, ingredients: 31, tools: 17 },
  { date: "05-21", skincare: 63, makeup: 44, ingredients: 32, tools: 19 },
  { date: "05-22", skincare: 71, makeup: 57, ingredients: 38, tools: 24 },
  { date: "05-23", skincare: 64, makeup: 55, ingredients: 37, tools: 22 },
  { date: "05-24", skincare: 76, makeup: 60, ingredients: 39, tools: 23 },
];

const metricCards = [
  { label: "今日可追热点", value: "102", sub: "近7天", delta: "+真实", icon: Flame, color: "from-teal-500 to-emerald-600", line: "teal" },
  { label: "账号匹配机会", value: "86", suffix: "分", sub: "近7天", delta: "+计算", icon: Target, color: "from-blue-500 to-sky-500", line: "blue" },
  { label: "高潜选题", value: "18", sub: "内容样本", delta: "+采集", icon: Lightbulb, color: "from-amber-400 to-orange-500", line: "amber" },
  { label: "已过热提醒", value: "7", sub: "风险样本", delta: "+监控", icon: AlertTriangle, color: "from-red-500 to-rose-500", line: "red" },
];

const fallbackTopicRows: TopicRow[] = [
  { rank: 1, topic: "夏日持妆不卡粉底妆", stage: "爆发中", heat: "86分", match: "95%", competition: "中", difficulty: "中", platforms: ["小红书", "抖音", "B站"], advice: "立即跟" },
  { rank: 2, topic: "油皮控油真实测评", stage: "爆发中", heat: "73分", match: "92%", competition: "中", difficulty: "低", platforms: ["小红书", "抖音"], advice: "立即跟" },
  { rank: 3, topic: "早 C 晚 A 新手入门指南", stage: "长尾可做", heat: "48分", match: "88%", competition: "低", difficulty: "中", platforms: ["小红书", "B站"], advice: "可长尾" },
  { rank: 4, topic: "防晒黑科技大盘点", stage: "长尾可做", heat: "40分", match: "82%", competition: "低", difficulty: "中", platforms: ["小红书", "抖音", "视频号"], advice: "可长尾" },
  { rank: 5, topic: "痘肌护肤全流程", stage: "谨慎追", heat: "32分", match: "75%", competition: "高", difficulty: "高", platforms: ["小红书", "抖音"], advice: "谨慎跟" },
];

const fallbackRecommendations: TopicCard[] = [
  { title: "油皮夏天的底妆救星", stage: "爆发中", reason: "油皮痛点强，搜索增长快。", tags: ["美妆测评", "油皮护肤", "成分党"], heat: "86分", tone: "from-orange-100 to-amber-50" },
  { title: "早 C 晚 A 搭配思路", stage: "长尾可做", reason: "新手关注高，适合知识类讲解。", tags: ["护肤干货", "成分党", "新手友好"], heat: "48分", tone: "from-sky-100 to-cyan-50" },
  { title: "新手眼妆公式", stage: "爆发中", reason: "眼妆教程需求大，转化较好。", tags: ["彩妆教程", "新手友好", "学生党"], heat: "48分", tone: "from-rose-100 to-pink-50" },
  { title: "高倍防晒测评合集", stage: "长尾可做", reason: "防晒季持续热搜，适合合集内容。", tags: ["防晒测评", "成分党", "实测党"], heat: "38分", tone: "from-blue-100 to-sky-50" },
];

const fallbackCaseRows = [
  ["Hook 形式", "痛点提问 + 对比反差"],
  ["开场结构", "抛出问题 -> 展示结果 -> 引出方案"],
  ["视频节奏", "前 3 秒抓注意 -> 过程对比 -> 结论总结"],
  ["评论需求", "求色号 / 求链接 / 皮肤质建议"],
  ["可复用模板", "底妆测评模板"],
];

const navItems = [
  { label: "总览", href: "#overview" },
  { label: "今日热点", href: "#hot-topics" },
  { label: "选题推荐", href: "#topic-recommendations" },
  { label: "爆款拆解", href: "#case-study" },
  { label: "脚本生成", href: "#task-flow" },
  { label: "内容日历", href: "#task-flow" },
];
const fallbackChips = ["美妆", "穿搭", "母婴", "职场", "AI工具", "生活方式"];
const cardClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";
type SourceKind = "真实采集" | "规则计算" | "示例兜底";

function MiniSparkline({ color }: { color: string }) {
  const stroke = color === "teal" ? "#0f9488" : color === "blue" ? "#2563eb" : color === "amber" ? "#f59e0b" : "#ef4444";
  return (
    <svg aria-hidden className="h-12 w-full" viewBox="0 0 144 48">
      <path d="M3 35 C14 31 17 23 27 26 C38 30 37 9 50 15 C63 21 65 34 78 22 C91 10 95 29 107 20 C119 11 124 13 139 7" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2.6" />
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
  return <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[0.62rem] font-black", map[label] ?? "bg-stone-100 text-stone-700")}>{label.slice(0, 2)}</span>;
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

function formatScore(value: number) {
  return `${Math.round(value)}分`;
}

function toTopicStage(stage: string | null | undefined, heatScore: number): TopicStage {
  if (stage === "已过热") return "谨慎追";
  if (stage === "刚升温") return "爆发中";
  if (stage === "爆发中" || stage === "长尾可做" || stage === "谨慎追") return stage;
  return heatScore >= 70 ? "爆发中" : heatScore >= 45 ? "长尾可做" : "谨慎追";
}

function toDifficulty(heatScore: number): Level {
  if (heatScore >= 80) return "高";
  if (heatScore >= 50) return "中";
  return "低";
}

function stageClass(stage: TopicStage) {
  if (stage === "爆发中") return "border-red-100 bg-red-50 text-red-600";
  if (stage === "长尾可做") return "border-orange-100 bg-orange-50 text-orange-600";
  return "border-amber-100 bg-amber-50 text-amber-600";
}

function adviceClass(advice: TopicRow["advice"]) {
  if (advice === "立即跟") return "border-teal-200 bg-teal-50 text-teal-700";
  if (advice === "可长尾") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
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

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "暂无";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function readSnapshotValue<T>(value: unknown): T | null {
  if (value == null) return null;
  return value as T;
}

function positiveBatchIndex(value: string | undefined, size: number) {
  if (size <= 0) return 0;
  const parsed = Number.parseInt(value ?? "0", 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.abs(parsed) % size;
}

export default async function CreatorTrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);

  const [{ batch }, creatorPreference, overview, topTopics, topContents, realTrendData, analysis] = await Promise.all([
    searchParams,
    prisma.creatorProfile.findUnique({
      where: { userId: session.userId },
      select: { insightDirection: true },
    }),
    getCreatorTrendsOverview(),
    getCreatorTopTopics(),
    prisma.insightContent.findMany({
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 8,
    }),
    getCreatorTrendSeries(7),
    getCreatorInsightAnalysis(),
  ]);
  const currentDirection = getInsightDirection(creatorPreference?.insightDirection);
  const dailySnapshot = await prisma.creatorTrendDailySnapshot.findFirst({
    where: { direction: currentDirection.slug },
    orderBy: [{ date: "desc" }, { generatedAt: "desc" }],
  });
  const snapshotOverview = readSnapshotValue<CreatorTrendOverview>(dailySnapshot?.overview);
  const snapshotTrendData = readSnapshotValue<CreatorTrendPoint[]>(dailySnapshot?.trendSeries);
  const snapshotTopicRows = readSnapshotValue<TopicRow[]>(dailySnapshot?.topicRows);
  const snapshotRecommendationBatches = readSnapshotValue<TopicCard[][]>(dailySnapshot?.recommendationBatches) ?? [];
  const snapshotCaseStudy = readSnapshotValue<CaseStudySnapshot>(dailySnapshot?.caseStudy);
  const selectedBatchIndex = positiveBatchIndex(batch, snapshotRecommendationBatches.length);
  const nextBatchIndex = snapshotRecommendationBatches.length > 1 ? (selectedBatchIndex + 1) % snapshotRecommendationBatches.length : 0;
  const chips = currentDirection.chips.length > 0 ? currentDirection.chips : fallbackChips;

  const displayTrendData = snapshotTrendData && snapshotTrendData.length >= 2 ? snapshotTrendData : realTrendData.length >= 2 ? realTrendData : trendData;
  const hasRealData = topTopics.length > 0 || topContents.length > 0 || analysis.topics.length > 0;
  const topCase = topContents[0];
  const trendSource: SourceKind = snapshotTrendData && snapshotTrendData.length >= 2 ? "规则计算" : realTrendData.length >= 2 ? "真实采集" : "示例兜底";
  const topicSource: SourceKind = snapshotTopicRows && snapshotTopicRows.length > 0 ? "规则计算" : topTopics.length > 0 ? "规则计算" : "示例兜底";
  const recommendationSource: SourceKind = snapshotRecommendationBatches.length > 0 ? "规则计算" : analysis.recommendations.length > 0 ? "规则计算" : "示例兜底";
  const caseSource: SourceKind = snapshotCaseStudy ? "规则计算" : topCase ? "真实采集" : "示例兜底";
  const hasExampleFallback = [trendSource, topicSource, recommendationSource, caseSource].includes("示例兜底");
  const dataSourceLabel = dailySnapshot ? "每日快照" : hasRealData ? "实时计算" : "示例兜底";
  const dataSourceDetail = dailySnapshot
    ? `更新于 ${formatDateTime(dailySnapshot.generatedAt)}，批次 ${selectedBatchIndex + 1}/${Math.max(1, snapshotRecommendationBatches.length)}`
    : hasRealData
      ? "当前方向暂无每日快照，页面正在使用已采集数据实时计算。"
      : "当前方向暂无足够真实采集数据，页面正在显示示例内容。";
  const metricSource = snapshotOverview ?? overview;
  const displayMetrics = metricCards.map((card) => {
    if (card.label === "今日可追热点") return { ...card, value: String(metricSource.trackableTopics || analysis.overview.trackableTopics), delta: hasRealData || snapshotOverview ? "+真实" : "待采集" };
    if (card.label === "账号匹配机会") return { ...card, value: String(Math.min(99, 70 + (metricSource.matchOpportunities || analysis.overview.matchOpportunities))), delta: hasRealData || snapshotOverview ? "+计算" : "待采集" };
    if (card.label === "高潜选题") return { ...card, value: String(metricSource.highPotential || analysis.overview.highPotential), delta: hasRealData || snapshotOverview ? "+采集" : "待采集" };
    return { ...card, value: String(metricSource.overheated || analysis.overview.overheated), delta: hasRealData || snapshotOverview ? "+监控" : "待采集" };
  });

  const displayTopicRows: TopicRow[] =
    snapshotTopicRows && snapshotTopicRows.length > 0
      ? snapshotTopicRows
      : topTopics.length > 0
      ? topTopics.slice(0, 5).map((row) => {
          const stage = toTopicStage(row.stage, row.heatScore);
          return {
            rank: row.rank,
            topic: row.topic,
            stage,
            heat: formatScore(row.heatScore),
            match: `${Math.min(98, Math.max(70, Math.round(row.heatScore)))}%`,
            competition: row.heatScore >= 85 ? "高" : row.heatScore >= 55 ? "中" : "低",
            difficulty: toDifficulty(row.heatScore),
            platforms: row.platforms.length > 0 ? row.platforms.map(platformLabel) : ["抖音"],
            advice: row.advice as TopicRow["advice"],
          };
        })
      : fallbackTopicRows;

  const displayRecommendations: TopicCard[] =
    snapshotRecommendationBatches[selectedBatchIndex]?.length > 0
      ? snapshotRecommendationBatches[selectedBatchIndex]
      : analysis.recommendations.length > 0
      ? analysis.recommendations.slice(0, 4).map((item) => ({
          title: item.title,
          stage: item.heat.includes("分") && Number.parseInt(item.heat, 10) >= 60 ? "爆发中" : "长尾可做",
          reason: item.reason,
          tags: item.tags.map(platformLabel),
          heat: item.heat,
          tone: item.tone,
        }))
      : fallbackRecommendations;

  const displayCaseTitle = snapshotCaseStudy?.title ?? topCase?.title ?? "油皮夏季持妆底妆实测";
  const displayCaseLikes = snapshotCaseStudy?.likes ?? (topCase ? `${topCase.likeCount.toLocaleString()}赞` : "1.2万赞");
  const displayCaseStats = snapshotCaseStudy?.stats ?? (topCase
    ? [topCase.likeCount, topCase.commentCount, topCase.collectCount, topCase.shareCount].map((value) => value.toLocaleString())
    : ["1.2万", "892", "1,045", "2,354"]);
  const displayCaseRows = snapshotCaseStudy?.rows ?? (topCase
    ? [
        ["平台", platformLabel(topCase.platform)],
        ["关键词", topCase.keyword ?? "未标注"],
        ["作者", topCase.authorName ?? "未知作者"],
        ["互动结构", `赞 ${topCase.likeCount.toLocaleString()} / 评 ${topCase.commentCount.toLocaleString()} / 藏 ${topCase.collectCount.toLocaleString()}`],
        ["可复用模板", "热点内容拆解模板"],
      ]
    : fallbackCaseRows);

  return (
    <>
      <style>{`
        main:has(> [data-creator-trends-shell]) {
          max-width: none !important;
          padding: 0 !important;
        }
      `}</style>
      <div data-creator-trends-shell className="min-h-screen bg-[#f8fafc] text-slate-950">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 flex-wrap items-center gap-4 px-8">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm">
                <Flame size={22} />
              </div>
              <p className="text-xl font-black tracking-tight">热点洞察台 | 达人创作版</p>
            </div>
            <nav className="flex flex-1 flex-wrap items-center gap-6 text-sm font-black text-slate-700">
              {navItems.map((item, index) => (
                <Link key={item.label} href={item.href} className={cn("py-6 transition hover:text-teal-700", index === 0 && "border-b-4 border-teal-600 text-teal-700")}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              {["近7天", "小红书", currentDirection.label, "达人运营"].map((item) => (
                <Link key={item} href={`/creator/trends?filter=${encodeURIComponent(item)}`} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black shadow-sm transition hover:border-teal-200 hover:text-teal-700">
                  {item}
                  {item === "近7天" ? <CalendarDays size={14} /> : <ChevronDown size={14} />}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <main className="space-y-5 p-8">
          <section className="flex flex-wrap items-center gap-4">
            <div className="flex h-12 min-w-[26rem] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
              <Search className="text-slate-400" size={20} />
              <span className="text-sm font-semibold text-slate-400">搜索热点 / 选题 / 关键词 / 对标账号</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {chips.map((chip, index) => (
                <Link key={chip} href={`/creator/trends?keyword=${encodeURIComponent(chip)}`} className={cn("rounded-xl border px-4 py-2 text-sm font-black shadow-sm transition hover:border-teal-200 hover:text-teal-700", index === 0 ? "border-teal-600 bg-teal-600 text-white hover:text-white" : "border-slate-200 bg-white text-slate-700")}>{chip}</Link>
              ))}
            </div>
          </section>

          <section className={cn(cardClass, "flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between")}>
            <div>
              <p className="text-sm font-black text-slate-950">数据来源：{dataSourceLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">当前方向：{currentDirection.label} · {dataSourceDetail}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SourceBadge kind={trendSource} />
              <SourceBadge kind={topicSource} />
              <SourceBadge kind={recommendationSource} />
              <SourceBadge kind={caseSource} />
            </div>
            {hasExampleFallback ? <p className="text-xs font-semibold text-amber-700">部分模块暂无真实数据，已使用示例兜底。</p> : null}
          </section>

          <section id="overview" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-4">
            {displayMetrics.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={cn(cardClass, "grid min-h-32 grid-cols-[5rem_1fr_8rem] items-center gap-4 p-5")}>
                  <div className={cn("flex size-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm", card.color)}>
                    <Icon size={30} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-700">{card.label}</p>
                    <p className="mt-1 text-4xl font-black tracking-tight">{card.value}<span className="text-xl">{card.suffix ?? ""}</span></p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{card.sub} <span className="text-red-500">{card.delta}</span></p>
                  </div>
                  <MiniSparkline color={card.line} />
                </div>
              );
            })}
          </section>

          <section id="hot-topics" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
            <div className={cn(cardClass, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">适合我的热点趋势</h2>
                  <SourceBadge kind={trendSource} />
                </div>
                <div className="flex rounded-lg border border-slate-200 text-sm font-black">
                  {["24小时", "7天", "30天"].map((item, index) => <span key={item} className={cn("px-4 py-2", index === 1 && "bg-blue-50 text-blue-600")}>{item}</span>)}
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

            <div className={cn(cardClass, "overflow-hidden p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">热点匹配度排行</h2>
                  <SourceBadge kind={topicSource} />
                </div>
                <Link href="#hot-topics" className="text-sm font-black text-blue-600 hover:text-blue-700">查看全部 &gt;</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[48rem] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>{["排名", "话题", "热度", "匹配度", "竞争度", "创作难度", "主要平台", "建议"].map((head) => <th key={head} className="px-3 py-3 font-black">{head}</th>)}</tr>
                  </thead>
                  <tbody>
                    {displayTopicRows.map((row) => (
                      <tr key={`${row.rank}-${row.topic}`} className="border-b border-slate-100">
                        <td className="px-3 py-3"><span className="inline-flex size-6 items-center justify-center rounded-md bg-amber-500 text-xs font-black text-white">{row.rank}</span></td>
                        <td className="px-3 py-3 font-black">{row.topic} <span className={cn("ml-2 rounded-md border px-2 py-1 text-xs", stageClass(row.stage))}>{row.stage}</span></td>
                        <td className="px-3 py-3 font-black">{row.heat}</td>
                        <td className="px-3 py-3 font-black text-teal-600">{row.match}</td>
                        <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">{row.competition}</span></td>
                        <td className="px-3 py-3"><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-600">{row.difficulty}</span></td>
                        <td className="px-3 py-3"><div className="flex gap-1">{row.platforms.map((platform) => <PlatformBadge key={platform} label={platform} />)}</div></td>
                        <td className="px-3 py-3"><span className={cn("rounded-md border px-2 py-1 text-xs font-black", adviceClass(row.advice))}>{row.advice}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-400">匹配度综合账号标签、历史内容表现和粉丝画像计算。</p>
            </div>
          </section>

          <section id="topic-recommendations" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.9fr_0.75fr]">
            <div className={cn(cardClass, "overflow-hidden p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">AI 选题推荐</h2>
                  <SourceBadge kind={recommendationSource} />
                </div>
                <Link href={`/creator/trends?batch=${nextBatchIndex}#topic-recommendations`} className="flex items-center gap-1 text-sm font-black text-teal-700">
                  <RefreshCw size={15} />换一批
                </Link>
              </div>
              <div className="-mx-1 overflow-x-auto px-1 pb-2">
                <div className="flex min-w-max gap-4">
                  {displayRecommendations.map((item) => (
                    <div key={item.title} className="w-40 shrink-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className={cn("mb-3 h-24 rounded-lg bg-gradient-to-br", item.tone)} />
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 font-black">{item.title}</p>
                        <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", stageClass(item.stage))}>{item.stage}</span>
                      </div>
                      <p className="mt-3 text-xs font-black text-slate-500">推荐理由</p>
                      <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.reason}</p>
                      <div className="mt-3 flex flex-wrap gap-2">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="whitespace-nowrap rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">{tag}</span>)}</div>
                      <p className="mt-3 text-sm font-black text-red-500">预计热度 {item.heat}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link href="#task-flow" className="whitespace-nowrap rounded-lg border border-teal-600 px-2 py-2 text-center text-xs font-black text-teal-700 transition hover:bg-teal-50">生成脚本</Link>
                        <Link href="#task-flow" className="whitespace-nowrap rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-black text-slate-700 transition hover:bg-slate-50">加入日历</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="case-study" className={cn(cardClass, "scroll-mt-28 p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">爆款案例拆解</h2>
                  <SourceBadge kind={caseSource} />
                </div>
                <Link href="#case-study" className="text-sm font-black text-blue-600 hover:text-blue-700">查看更多</Link>
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-4">
                <div className="flex h-28 items-end rounded-xl bg-gradient-to-br from-amber-100 to-stone-200 p-2">
                  <span className="rounded-full bg-stone-700 px-2 py-1 text-xs font-black text-white">{displayCaseLikes}</span>
                </div>
                <div>
                  <p className="line-clamp-2 font-black">{displayCaseTitle}</p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-black text-slate-600">
                    {displayCaseStats.map((stat, index) => <span key={`${stat}-${index}`}>{stat}</span>)}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {displayCaseRows.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[6rem_1fr] rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <span className="font-bold text-slate-500">{label}</span>
                    <span className="font-black">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <Link href="#task-flow" className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100">底妆测评模板</Link>
                <Link href="#task-flow" className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100"><Copy className="mr-1 inline" size={14} />复制脚本</Link>
              </div>
            </div>

            <div id="task-flow" className={cn(cardClass, "scroll-mt-28 p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">创作任务流</h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">开发中</span>
              </div>
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-lg font-black text-slate-400">开发中</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
