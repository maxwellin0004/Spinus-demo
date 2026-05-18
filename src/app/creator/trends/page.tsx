import { UserRole } from "@prisma/client";
import Link from "next/link";
import { AlertTriangle, Flame, Lightbulb, Target } from "lucide-react";
import { CreatorTrendDetailPanels } from "@/components/creator-trend-detail-panels";
import type { CreatorTrendPoint } from "@/components/creator-trend-chart";
import {
  CreatorTrendFilterProvider,
  CreatorTrendHeaderFilters,
  CreatorTrendHotTopics,
  CreatorTrendSearch,
  type CreatorTrendFilters,
} from "@/components/creator-trends-interactive";
import { requireRole } from "@/lib/auth";
import { buildInsightReason, evaluateInsightConfidence, formatInsightSampleText, formatInsightUpdatedAt, type InsightConfidence, type InsightSourceKind } from "@/lib/insights/credibility";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTIONS, getInsightDirection } from "@/lib/insights/directions";
import { getCreatorTopTopics, getCreatorTrendSeries, getCreatorTrendsOverview, getXiaohongshuOpportunityRows } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type TopicStage = "爆发中" | "长尾可做" | "谨慎跟进";
type Level = "低" | "中" | "高";
type SourceKind = InsightSourceKind;
type TrendRange = CreatorTrendFilters["range"];
type TrendPlatform = CreatorTrendFilters["platform"];

type TopicRow = {
  rank: number;
  topic: string;
  stage: TopicStage;
  heat: string;
  match: string;
  competition: Level;
  difficulty: Level;
  platforms: string[];
  advice: "立即跟进" | "可长期做" | "谨慎跟进";
  source?: string;
  updatedAt?: string;
  sampleCount?: number;
  commentSampleCount?: number;
  platformSourceCount?: number;
  confidence?: InsightConfidence;
  reason?: string;
};

type CreatorTrendOverview = {
  trackableTopics: number;
  matchOpportunities: number;
  highPotential: number;
  overheated: number;
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

const navItems = [
  { label: "总览", href: "#overview" },
  { label: "今日热点", href: "#hot-topics" },
  { label: "选题推荐", href: "#topic-recommendations" },
  { label: "爆款拆解", href: "#case-study" },
  { label: "脚本生成", href: "#task-flow" },
  { label: "内容日历", href: "#task-flow" },
];

const cardClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";

const platformFilters = [
  { label: "全部", value: "all" as const },
  { label: "小红书", value: "xiaohongshu" as const },
  { label: "抖音", value: "douyin" as const },
  { label: "微博", value: "weibo" as const },
  { label: "B站", value: "bilibili" as const },
];

const rangeFilters = [
  { label: "24小时", value: "24h" as const, days: 1 },
  { label: "7天", value: "7d" as const, days: 7 },
  { label: "30天", value: "30d" as const, days: 30 },
];

const scenarioFilters = [
  { label: "达人运营", value: "creator_ops" },
  { label: "选题种草", value: "topic_seeding" },
  { label: "爆款复盘", value: "case_review" },
];

function MiniSparkline({ color }: { color: string }) {
  const stroke = color === "teal" ? "#0f9488" : color === "blue" ? "#2563eb" : color === "amber" ? "#f59e0b" : "#ef4444";
  return (
    <svg aria-hidden className="h-12 w-full" viewBox="0 0 144 48">
      <path d="M3 35 C14 31 17 23 27 26 C38 30 37 9 50 15 C63 21 65 34 78 22 C91 10 95 29 107 20 C119 11 124 13 139 7" fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="2.6" />
    </svg>
  );
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
  if (stage === "已过热") return "谨慎跟进";
  if (stage === "刚升温") return "爆发中";
  if (stage === "爆发中" || stage === "长尾可做" || stage === "谨慎跟进") return stage;
  return heatScore >= 70 ? "爆发中" : heatScore >= 45 ? "长尾可做" : "谨慎跟进";
}

function toDifficulty(heatScore: number): Level {
  if (heatScore >= 80) return "高";
  if (heatScore >= 50) return "中";
  return "低";
}

function sourceClass(kind: SourceKind) {
  if (kind === "真实采集") return "border-teal-200 bg-teal-50 text-teal-700";
  if (kind === "AI生成") return "border-violet-200 bg-violet-50 text-violet-700";
  if (kind === "规则计算") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function confidenceClass(confidence: InsightConfidence) {
  if (confidence === "高可信") return "border-teal-200 bg-teal-50 text-teal-700";
  if (confidence === "中可信") return "border-blue-200 bg-blue-50 text-blue-700";
  if (confidence === "低可信") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function SourceBadge({ kind }: { kind: SourceKind }) {
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", sourceClass(kind))}>{kind}</span>;
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

function normalizeTrendPlatform(value: string | undefined): TrendPlatform {
  return platformFilters.some((item) => item.value === value) ? (value as TrendPlatform) : "all";
}

function normalizeTrendRange(value: string | undefined): TrendRange {
  return rangeFilters.some((item) => item.value === value) ? (value as TrendRange) : "7d";
}

function normalizeDirection(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return INSIGHT_DIRECTIONS.some((item) => item.slug === value) ? value : fallback;
}

function normalizeScenario(value: string | undefined) {
  return scenarioFilters.some((item) => item.value === value) ? value ?? "creator_ops" : "creator_ops";
}

function readLegacyFilter(filter: string | undefined): Partial<CreatorTrendFilters> {
  if (!filter) return {};
  if (filter === "7天") return { range: "7d" };
  if (filter === "小红书") return { platform: "xiaohongshu" };
  const direction = INSIGHT_DIRECTIONS.find((item) => item.label === filter);
  if (direction) return { direction: direction.slug };
  const scenario = scenarioFilters.find((item) => item.label === filter);
  if (scenario) return { scenario: scenario.value };
  return {};
}

export default async function CreatorTrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; rec?: string; platform?: string; range?: string; direction?: string; scenario?: string; keyword?: string; filter?: string; pool?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const [{ batch, rec, platform, range, direction, scenario, keyword, filter, pool }, creatorPreference] = await Promise.all([
    searchParams,
    prisma.creatorProfile.findUnique({
      where: { userId: session.userId },
      select: { id: true, insightDirection: true },
    }),
  ]);
  if (!creatorPreference) return null;

  const legacyFilters = readLegacyFilter(filter);
  const filters: CreatorTrendFilters = {
    range: legacyFilters.range ?? normalizeTrendRange(range),
    platform: legacyFilters.platform ?? normalizeTrendPlatform(platform),
    direction: normalizeDirection(legacyFilters.direction ?? direction, creatorPreference.insightDirection ?? DEFAULT_INSIGHT_DIRECTION),
    scenario: normalizeScenario(legacyFilters.scenario ?? scenario),
    keyword: keyword?.trim() ?? legacyFilters.keyword ?? "",
  };
  const filterScope = {
    directionSlug: filters.direction,
    platform: filters.platform,
    keyword: filters.keyword,
    days: rangeFilters.find((item) => item.value === filters.range)?.days ?? 7,
    scenario: filters.scenario,
  };

  const [overview, topTopics, xiaohongshuOpportunities, realTrendData, dailySnapshot, savedTrends] = await Promise.all([
    getCreatorTrendsOverview(filterScope),
    getCreatorTopTopics(filterScope),
    getXiaohongshuOpportunityRows(filterScope),
    getCreatorTrendSeries(filterScope.days, filters.direction, { platform: filters.platform, keyword: filters.keyword }),
    prisma.creatorTrendDailySnapshot.findFirst({
      where: { direction: filters.direction },
      orderBy: [{ date: "desc" }, { generatedAt: "desc" }],
    }),
    prisma.creatorSavedTrend.findMany({
      where: { creatorId: creatorPreference.id },
      orderBy: [{ updatedAt: "desc" }],
      take: 12,
    }),
  ]);

  const currentDirection = getInsightDirection(filters.direction);
  const snapshotOverview = readSnapshotValue<CreatorTrendOverview>(dailySnapshot?.overview);
  const snapshotTrendData = readSnapshotValue<CreatorTrendPoint[]>(dailySnapshot?.trendSeries);
  const snapshotTopicRows = readSnapshotValue<TopicRow[]>(dailySnapshot?.topicRows);
  const trendDataSource = snapshotTrendData && snapshotTrendData.length >= 2 ? snapshotTrendData : realTrendData.length >= 2 ? realTrendData : trendData;
  const hasRealData = topTopics.length > 0 || overview.trackableTopics > 0;
  const trendSource: SourceKind = snapshotTrendData && snapshotTrendData.length >= 2 ? "规则计算" : realTrendData.length >= 2 ? "真实采集" : "示例兜底";
  const topicSource: SourceKind = snapshotTopicRows && snapshotTopicRows.length > 0 ? "规则计算" : topTopics.length > 0 ? "规则计算" : "示例兜底";
  const hasExampleFallback = [trendSource, topicSource].includes("示例兜底");
  const dataSourceLabel = hasRealData ? "实时计算" : dailySnapshot ? "每日快照" : "示例兜底";
  const dataSourceDetail = hasRealData
    ? "当前方向已启用实时计算，快照仅作为兜底。"
    : dailySnapshot
      ? `同方向达人共享，更新于 ${formatDateTime(dailySnapshot.generatedAt)}。`
      : "当前方向暂无足够真实采集数据，页面正在显示示例内容。";

  const metricSource = snapshotOverview ?? overview;
  const displayMetrics = metricCards.map((card) => {
    if (card.label === "今日可追热点") return { ...card, value: String(metricSource.trackableTopics), delta: hasRealData || snapshotOverview ? "+真实" : "待采集" };
    if (card.label === "账号匹配机会") return { ...card, value: String(Math.min(99, 70 + metricSource.matchOpportunities)), delta: hasRealData || snapshotOverview ? "+计算" : "待采集" };
    if (card.label === "高潜选题") return { ...card, value: String(metricSource.highPotential), delta: hasRealData || snapshotOverview ? "+采集" : "待采集" };
    return { ...card, value: String(metricSource.overheated), delta: hasRealData || snapshotOverview ? "+监控" : "待采集" };
  });

  const displayTopicRows: TopicRow[] =
    snapshotTopicRows && snapshotTopicRows.length > 0
      ? snapshotTopicRows.map((row) => {
          const source = row.source ?? "综合热榜";
          const updatedAt = row.updatedAt ?? dailySnapshot?.generatedAt.toISOString();
          const sampleCount = row.sampleCount ?? 0;
          const commentSampleCount = row.commentSampleCount ?? 0;
          const platformSourceCount = row.platformSourceCount ?? row.platforms.length;
          const confidence =
            row.confidence ??
            evaluateInsightConfidence({
              sourceKind: "规则计算",
              sampleCount,
              commentSampleCount,
              platformSourceCount,
              updatedAt,
            });
          return {
            ...row,
            source,
            updatedAt,
            sampleCount,
            commentSampleCount,
            platformSourceCount,
            confidence,
            reason:
              row.reason ??
              buildInsightReason({
                topic: row.topic,
                matchScore: Number.parseInt(row.match, 10),
                sampleCount,
                commentSampleCount,
                platformSourceCount,
                source,
              }),
          };
        })
      : topTopics.length > 0
        ? topTopics.slice(0, 8).map((row) => {
            const stage = toTopicStage(row.stage, row.heatScore);
            const source = "综合热榜";
            const updatedAt = row.updatedAt;
            const sampleCount = row.sampleCount ?? 0;
            const commentSampleCount = row.commentSampleCount ?? 0;
            const platformSourceCount = row.platformSourceCount ?? row.platforms.length;
            return {
              rank: row.rank,
              topic: row.topic,
              stage,
              heat: formatScore(row.heatScore),
              match: `${Math.min(98, Math.max(70, Math.round(row.heatScore)))}%`,
              competition: row.heatScore >= 85 ? "高" : row.heatScore >= 55 ? "中" : "低",
              difficulty: toDifficulty(row.heatScore),
              platforms: row.platforms.length > 0 ? row.platforms.map(platformLabel) : ["抖音"],
              advice: row.heatScore >= 70 ? "立即跟进" : row.heatScore >= 45 ? "可长期做" : "谨慎跟进",
              source,
              updatedAt,
              sampleCount,
              commentSampleCount,
              platformSourceCount,
              confidence:
                row.confidence ??
                evaluateInsightConfidence({
                  sourceKind: "真实采集",
                  sampleCount,
                  commentSampleCount,
                  platformSourceCount,
                  updatedAt,
                }),
              reason:
                row.reason ??
                buildInsightReason({
                  topic: row.topic,
                  heatScore: row.heatScore,
                  sampleCount,
                  commentSampleCount,
                  platformSourceCount,
                  source,
                }),
            };
          })
        : [];

  const displayXiaohongshuRows = xiaohongshuOpportunities.map<TopicRow>((row, index) => ({
    rank: index + 1,
    topic: row.topic,
    stage: row.match >= 82 ? "爆发中" : row.match >= 68 ? "长尾可做" : "谨慎跟进",
    heat: `${row.heat}分`,
    match: `${row.match}%`,
    competition: row.competition as Level,
    difficulty: row.titlePotential as Level,
    platforms: ["小红书"],
    advice: row.action === "立即做" ? "立即跟进" : row.action === "观察补样本" ? "可长期做" : "谨慎跟进",
    source: row.source,
    updatedAt: row.updatedAt,
    sampleCount: row.sampleCount,
    commentSampleCount: row.commentSampleCount,
    platformSourceCount: row.platformSourceCount,
    confidence: row.confidence,
    reason: row.reason,
  }));

  const mergedTopicRows = [...displayTopicRows, ...displayXiaohongshuRows].filter((row, index, rows) => {
    const key = `${row.topic}-${row.platforms.join(",")}`;
    return rows.findIndex((candidate) => `${candidate.topic}-${candidate.platforms.join(",")}` === key) === index;
  });
  const topicSampleCount = mergedTopicRows.reduce((sum, row) => sum + (row.sampleCount ?? 0), 0);
  const topicCommentSampleCount = mergedTopicRows.reduce((sum, row) => sum + (row.commentSampleCount ?? 0), 0);
  const topicPlatformSourceCount = Math.max(
    ...mergedTopicRows.map((row) => row.platformSourceCount ?? row.platforms.length),
    0,
  );
  const freshestTopicUpdate =
    mergedTopicRows
      .map((row) => (row.updatedAt ? new Date(row.updatedAt) : null))
      .filter((value): value is Date => value !== null && !Number.isNaN(value.getTime()))
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? dailySnapshot?.generatedAt;
  const pageConfidence = evaluateInsightConfidence({
    sourceKind: hasExampleFallback ? "示例兜底" : topicSource,
    sampleCount: topicSampleCount,
    commentSampleCount: topicCommentSampleCount,
    platformSourceCount: topicPlatformSourceCount,
    updatedAt: freshestTopicUpdate,
  });
  const sampleText = formatInsightSampleText({
    sampleCount: topicSampleCount,
    commentSampleCount: topicCommentSampleCount,
    platformSourceCount: topicPlatformSourceCount,
  });

  const directionOptions = INSIGHT_DIRECTIONS.map((item) => ({
    slug: item.slug,
    label: item.label,
    chips: [...item.chips],
    creatorTrendLabels: [...item.creatorTrendLabels],
  }));

  return (
    <>
      <style>{`
        main:has(> [data-creator-trends-shell]) {
          max-width: none !important;
          padding: 0 !important;
        }
      `}</style>
      <CreatorTrendFilterProvider initialFilters={filters} directions={directionOptions}>
        <div data-creator-trends-shell className="min-h-screen bg-[#f8fafc] text-slate-950">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-20 min-w-0 flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:px-8 lg:py-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm">
                  <Flame size={22} />
                </div>
                <p className="min-w-0 truncate text-lg font-black tracking-tight text-horizontal sm:text-xl">热点洞察台 | 达人创作版</p>
              </div>
              <nav className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto no-scrollbar text-sm font-black text-slate-700 lg:justify-center">
                {navItems.map((item, index) => (
                  <Link key={item.label} href={item.href} className={cn("shrink-0 whitespace-nowrap py-2 transition hover:text-teal-700 lg:py-6", index === 0 && "border-b-4 border-teal-600 text-teal-700")}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <CreatorTrendHeaderFilters />
            </div>
          </header>

          <main className="space-y-5 p-4 sm:p-6 lg:p-8">
            <CreatorTrendSearch />

            <section className={cn(cardClass, "flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between")}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">数据来源：{dataSourceLabel}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">当前方向：{currentDirection.label} · {dataSourceDetail}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">该页展示同方向达人共享趋势池，由系统每日生成。</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                  <span className={cn("rounded-full border px-2.5 py-1", confidenceClass(pageConfidence))}>可信度：{pageConfidence}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">更新：{formatInsightUpdatedAt(freshestTopicUpdate)}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">{sampleText}</span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">推荐原因：热度、匹配度、平台覆盖综合计算</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <SourceBadge kind={trendSource} />
                <SourceBadge kind={topicSource} />
              </div>
              {hasExampleFallback ? <p className="text-xs font-semibold text-amber-700">部分模块暂无真实数据，已启用示例兜底。</p> : null}
            </section>

            <section id="overview" className="scroll-mt-28 grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
              {displayMetrics.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className={cn(cardClass, "grid min-h-32 min-w-0 grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-4 p-5 lg:grid-cols-[4.25rem_minmax(8rem,1fr)_7rem] 2xl:grid-cols-[4.25rem_minmax(0,1fr)] min-[1800px]:grid-cols-[4.25rem_minmax(8rem,1fr)_7rem]")}>
                    <div className={cn("flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm", card.color)}>
                      <Icon size={30} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-horizontal whitespace-nowrap text-sm font-black text-slate-700">{card.label}</p>
                      <p className="mt-1 text-4xl font-black tracking-tight">
                        {card.value}
                        <span className="text-xl">{card.suffix ?? ""}</span>
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {card.sub} <span className="text-red-500">{card.delta}</span>
                      </p>
                    </div>
                    <div className="hidden lg:block 2xl:hidden min-[1800px]:block"><MiniSparkline color={card.line} /></div>
                  </div>
                );
              })}
            </section>

            <CreatorTrendHotTopics
              key={`${filters.direction}:${filters.platform}:${filters.range}:${filters.keyword}`}
              trendData={trendDataSource}
              topicRows={mergedTopicRows}
              trendSource={trendSource}
              topicSource={topicSource}
            />

            <CreatorTrendDetailPanels
              initialBatch={batch}
              initialRec={rec}
              initialPool={pool}
              savedTrends={savedTrends.map((item) => ({
                id: item.id,
                title: item.title,
                topic: item.topic,
                platform: item.platform,
                status: item.status,
                reason: item.reason,
                updatedAt: item.updatedAt.toISOString(),
              }))}
            />
          </main>
        </div>
      </CreatorTrendFilterProvider>
    </>
  );
}
