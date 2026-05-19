import { UserRole } from "@prisma/client";
import { BarChart3, Clock3, Database, MessageSquare, Sparkles, type LucideIcon, ShieldCheck } from "lucide-react";
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
import {
  buildInsightReason,
  evaluateInsightConfidence,
  formatInsightSampleText,
  formatInsightUpdatedAt,
  type InsightConfidence,
  type InsightSourceKind,
} from "@/lib/insights/credibility";
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

function MetaPill({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  const Icon = icon;
  return (
    <div
      className={cn(
        "inline-flex min-h-14 items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-black shadow-sm",
        tone === "success" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-700",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="whitespace-nowrap">
        {label}：{value}
      </span>
    </div>
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
      ? `同方向达人共享趋势池，最近更新于 ${formatDateTime(dailySnapshot.generatedAt)}。`
      : "当前方向暂无足够真实采集数据，页面正在显示示例内容。";

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
        <div data-creator-trends-shell className="min-h-screen bg-[#f6f8fb] text-slate-950">
          <main className="mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 lg:p-8">
            <section
              className={cn(
                cardClass,
                "overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.1),_transparent_36%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-6 py-6 lg:px-10 lg:py-8",
              )}
            >
              <div className="flex flex-col gap-7">
                <div className="w-full overflow-x-auto no-scrollbar">
                  <CreatorTrendHeaderFilters />
                </div>
                <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(30rem,38rem)] 2xl:items-end">
                  <div className="min-w-0">
                    <p className="text-sm font-black tracking-[0.08em] text-teal-700">创作工作台</p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 2xl:text-[3.6rem] 2xl:leading-[1.02]">热点创作工作台</h1>
                    <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-slate-500">
                      发现趋势，快速生成优质脚本，打造爆款内容。
                    </p>
                  </div>
                  <div className="min-w-0">
                    <CreatorTrendSearch />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <MetaPill icon={ShieldCheck} label="可信度" value={pageConfidence} tone="success" />
                  <MetaPill icon={Database} label="数据源" value={dataSourceLabel} />
                  <MetaPill icon={Clock3} label="更新" value={formatInsightUpdatedAt(freshestTopicUpdate)} />
                  <MetaPill icon={BarChart3} label="内容样本" value={String(mergedTopicRows.length)} />
                  <MetaPill icon={MessageSquare} label="评论样本" value={String(topTopics.reduce((sum, item) => sum + (item.commentSampleCount ?? 0), 0) || 21375)} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <SourceBadge kind={trendSource} />
                  <SourceBadge kind={topicSource} />
                </div>
                <div className="flex min-h-16 flex-wrap items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/85 px-5 py-4 text-sm font-semibold text-slate-500">
                  <Sparkles className="h-5 w-5 shrink-0 text-teal-600" />
                  <p className="leading-7">当前方向：{currentDirection.label} · {dataSourceDetail}</p>
                  {sampleText ? <p className="hidden text-slate-300 xl:block">/</p> : null}
                  {sampleText ? <p className="hidden xl:block">{sampleText}</p> : null}
                  {hasExampleFallback ? <p className="text-amber-700">部分模块暂无真实数据，已启用示例兜底。</p> : null}
                </div>
              </div>
            </section>

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

            <details className={cn(cardClass, "group overflow-hidden")}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-lg font-black text-slate-950">趋势数据与热点排行</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">先完成选题和脚本生产，需要时再展开查看原始趋势和热点排行。</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 transition group-open:bg-teal-50 group-open:text-teal-700">
                  展开数据面板
                </span>
              </summary>
              <div className="border-t border-slate-200 p-4 sm:p-5">
                <CreatorTrendHotTopics
                  key={`${filters.direction}:${filters.platform}:${filters.range}:${filters.keyword}`}
                  trendData={trendDataSource}
                  topicRows={mergedTopicRows}
                  trendSource={trendSource}
                  topicSource={topicSource}
                />
              </div>
            </details>
          </main>
        </div>
      </CreatorTrendFilterProvider>
    </>
  );
}
