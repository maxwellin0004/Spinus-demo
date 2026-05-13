import { UserRole } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Flame, Lightbulb, RefreshCw, Target } from "lucide-react";
import type { CreatorTrendPoint } from "@/components/creator-trend-chart";
import {
  CreatorTrendFilterProvider,
  CreatorTrendHeaderFilters,
  CreatorTrendHotTopics,
  CreatorTrendSearch,
  type CreatorTrendFilters,
} from "@/components/creator-trends-interactive";
import { CopyScriptButton } from "@/components/copy-script-button";
import { requireRole } from "@/lib/auth";
import { getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";
import { deriveContentRecommendations } from "@/lib/insights/analysis";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTIONS, getInsightDirection, getInsightDirectionTerms } from "@/lib/insights/directions";
import { rewriteRecommendationsWithAi } from "@/lib/insights/recommendation-ai";
import { getCreatorTopTopics, getCreatorTrendSeries, getCreatorTrendsOverview, getXiaohongshuOpportunityRows } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";
import { extractCoverImageUrl } from "@/lib/tikhub/mappers";
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
  source?: string;
};

type TopicCard = {
  id?: string;
  title: string;
  stage: "爆发中" | "长尾可做";
  reason: string;
  platform?: string;
  tags: string[];
  heat: string;
  tone: string;
  keyword?: string;
  creator?: string;
  sampleTitle?: string;
  sampleContentUrl?: string;
  sampleSourceContentId?: string;
  metrics?: {
    likes: number;
    comments: number;
    collects: number;
    shares: number;
  };
  angles?: string[];
  coverImageUrl?: string;
};

type CreatorTrendOverview = {
  trackableTopics: number;
  matchOpportunities: number;
  highPotential: number;
  overheated: number;
};

type CaseStudySnapshot = {
  title?: string;
  coverImageUrl?: string;
  likes?: string;
  stats?: string[];
  rows?: [string, string][];
  watchPool?: WatchPoolItem[];
  draftPool?: DraftPoolItem[];
};

type WatchPoolItem = {
  topic: string;
  status: "升温中" | "观察中" | "已过热";
  action: "继续观察" | "可转草稿" | "暂缓";
  signal: string;
};

type DraftPoolItem = {
  title: string;
  angle: string;
  platforms: string[];
  reason: string;
  status: "待完善" | "可创作" | "已过热";
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


const fallbackRecommendations: TopicCard[] = [
  { title: "油皮夏天的底妆救星", stage: "爆发中", reason: "油皮痛点强，搜索增长快。", tags: ["美妆测评", "油皮护肤", "成分党"], heat: "86分", tone: "from-orange-100 to-amber-50" },
  { title: "早 C 晚 A 搭配思路", stage: "长尾可做", reason: "新手关注高，适合知识类讲解。", tags: ["护肤干货", "成分党", "新手友好"], heat: "48分", tone: "from-sky-100 to-cyan-50" },
  { title: "新手眼妆公式", stage: "爆发中", reason: "眼妆教程需求大，转化较好。", tags: ["彩妆教程", "新手友好", "学生党"], heat: "48分", tone: "from-rose-100 to-pink-50" },
  { title: "高倍防晒测评合集", stage: "长尾可做", reason: "防晒季持续热搜，适合合集内容。", tags: ["防晒测评", "成分党", "实测党"], heat: "38分", tone: "from-blue-100 to-sky-50" },
];

const fallbackRecommendationsByDirection: Record<string, TopicCard[]> = {
  beauty: fallbackRecommendations,
  fashion: [
    { title: "通勤衬衫怎么穿不土", stage: "爆发中", reason: "通勤场景需求稳定，评论区求链接高。", tags: ["穿搭测评", "通勤穿搭", "显瘦技巧"], heat: "82分", tone: "from-amber-100 to-orange-50" },
    { title: "小个子阔腿裤避坑清单", stage: "长尾可做", reason: "尺码与版型争议多，适合做对比内容。", tags: ["版型避坑", "小个子", "季节单品"], heat: "64分", tone: "from-cyan-100 to-sky-50" },
    { title: "百元质感西装外套怎么挑", stage: "爆发中", reason: "性价比与质感讨论集中，转化效率高。", tags: ["服饰测评", "性价比", "质感单品"], heat: "76分", tone: "from-rose-100 to-pink-50" },
    { title: "春夏鞋包配色三套公式", stage: "长尾可做", reason: "可复制模板强，适合连载型内容。", tags: ["配饰搭配", "配色公式", "新手友好"], heat: "58分", tone: "from-blue-100 to-indigo-50" },
  ],
  food: [
    { title: "低卡零食真实饱腹测评", stage: "爆发中", reason: "减脂需求持续，复购与口味讨论高。", tags: ["食品测评", "低卡", "复购推荐"], heat: "80分", tone: "from-lime-100 to-emerald-50" },
    { title: "配料表党怎么挑酸奶", stage: "长尾可做", reason: "配料表信息密度高，适合做知识向内容。", tags: ["配料表", "饮品测评", "成分解析"], heat: "63分", tone: "from-sky-100 to-cyan-50" },
    { title: "办公室囤货饮料避雷榜", stage: "爆发中", reason: "办公室场景明确，分享转发率高。", tags: ["饮料测评", "避坑", "通勤场景"], heat: "74分", tone: "from-orange-100 to-amber-50" },
    { title: "平价即食早餐一周计划", stage: "长尾可做", reason: "实操模板强，评论区互动稳定。", tags: ["早餐方案", "平价", "懒人食谱"], heat: "57分", tone: "from-teal-100 to-cyan-50" },
  ],
};


const fallbackCaseRows: [string, string][] = [
  ["Hook 形式", "痛点提问 + 对比反差"],
  ["开场结构", "抛出问题 -> 展示结果 -> 引出方案"],
  ["视频节奏", "前 3 秒抓注意 -> 过程对比 -> 结论总结"],
  ["评论需求", "求色号 / 求链接 / 皮肤质建议"],
  ["可复用模板", "底妆测评模板"],
];

const fallbackCaseRowsByDirection: Record<string, [string, string][]> = {
  beauty: fallbackCaseRows,
  fashion: [
    ["Hook 形式", "先上身效果 + 前后对比"],
    ["开场结构", "穿搭痛点 -> 单品方案 -> 场景落地"],
    ["视频节奏", "3秒上身 -> 版型细节 -> 结论建议"],
    ["评论需求", "求链接 / 求尺码 / 求替代款"],
    ["可复用模板", "通勤穿搭测评模板"],
  ],
  food: [
    ["Hook 形式", "直接试吃反应 + 口味结论"],
    ["开场结构", "选品标准 -> 实测结果 -> 购买建议"],
    ["视频节奏", "3秒开箱 -> 配料解析 -> 复购判断"],
    ["评论需求", "求链接 / 求口味 / 求热量信息"],
    ["可复用模板", "低卡食品测评模板"],
  ],
};

function getDirectionFallbackRecommendations(directionSlug: string) {
  return fallbackRecommendationsByDirection[directionSlug] ?? fallbackRecommendationsByDirection.beauty;
}

function getDirectionFallbackCaseRows(directionSlug: string) {
  return fallbackCaseRowsByDirection[directionSlug] ?? fallbackCaseRowsByDirection.beauty;
}

function getDirectionCaseTemplateKeyword(directionSlug: string) {
  if (directionSlug === "fashion") return "通勤穿搭测评模板";
  if (directionSlug === "food") return "低卡食品测评模板";
  return "底妆测评模板";
}

const navItems = [
  { label: "总览", href: "#overview" },
  { label: "今日热点", href: "#hot-topics" },
  { label: "选题推荐", href: "#topic-recommendations" },
  { label: "爆款拆解", href: "#case-study" },
  { label: "脚本生成", href: "#task-flow" },
  { label: "内容日历", href: "#task-flow" },
];
const cardClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";
type SourceKind = "真实采集" | "规则计算" | "示例兜底";
type TrendRange = CreatorTrendFilters["range"];
type TrendPlatform = CreatorTrendFilters["platform"];

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

function SourceBadge({ kind }: { kind: SourceKind }) {
  const style =
    kind === "真实采集"
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : kind === "规则计算"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-slate-200 bg-slate-50 text-slate-500";
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", style)}>{kind}</span>;
}

function poolStatusClass(status: WatchPoolItem["status"] | DraftPoolItem["status"]) {
  if (status === "升温中" || status === "可创作") return "border-teal-200 bg-teal-50 text-teal-700";
  if (status === "已过热") return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-500";
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

const platformFilters = [
  { label: "全部", value: "all" as const },
  { label: "小红书", value: "xiaohongshu" as const },
  { label: "抖音", value: "douyin" as const },
  { label: "微博", value: "weibo" as const },
  { label: "B站", value: "bilibili" as const },
];

const rangeFilters = [
  { label: "24小时", value: "24h" as const, days: 1 },
  { label: "近7天", value: "7d" as const, days: 7 },
  { label: "30天", value: "30d" as const, days: 30 },
];

const scenarioFilters = [
  { label: "达人运营", value: "creator_ops" },
  { label: "选题种草", value: "topic_seeding" },
  { label: "爆款复盘", value: "case_review" },
];

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

function directionTerms(directionSlug: string) {
  return getInsightDirectionTerms(directionSlug);
}

function matchesDirectionText(text: string, terms: string[]) {
  if (terms.length === 0) return true;
  return terms.some((term) => text.includes(term));
}

function normalizeScenario(value: string | undefined) {
  return scenarioFilters.some((item) => item.value === value) ? value ?? "creator_ops" : "creator_ops";
}

function readLegacyFilter(filter: string | undefined): Partial<CreatorTrendFilters> {
  if (!filter) return {};
  if (filter === "近7天") return { range: "7d" };
  if (filter === "小红书") return { platform: "xiaohongshu" };
  const direction = INSIGHT_DIRECTIONS.find((item) => item.label === filter);
  if (direction) return { direction: direction.slug };
  const scenario = scenarioFilters.find((item) => item.label === filter);
  if (scenario) return { scenario: scenario.value };
  return {};
}

function buildTrendHref(filters: CreatorTrendFilters, patch: Partial<CreatorTrendFilters>, hash = "") {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.range !== "7d") params.set("range", next.range);
  if (next.platform !== "all") params.set("platform", next.platform);
  if (next.direction !== DEFAULT_INSIGHT_DIRECTION) params.set("direction", next.direction);
  if (next.scenario !== "creator_ops") params.set("scenario", next.scenario);
  if (next.keyword.trim()) params.set("keyword", next.keyword.trim());
  const query = params.toString();
  return `/creator/trends${query ? `?${query}` : ""}${hash}`;
}

function buildTrendHrefWithExtra(filters: CreatorTrendFilters, patch: Partial<CreatorTrendFilters>, extra: Record<string, string | undefined>, hash = "") {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.range !== "7d") params.set("range", next.range);
  if (next.platform !== "all") params.set("platform", next.platform);
  if (next.direction !== DEFAULT_INSIGHT_DIRECTION) params.set("direction", next.direction);
  if (next.scenario !== "creator_ops") params.set("scenario", next.scenario);
  if (next.keyword.trim()) params.set("keyword", next.keyword.trim());
  Object.entries(extra).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return `/creator/trends${query ? `?${query}` : ""}${hash}`;
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
      select: { insightDirection: true },
    }),
  ]);
  const legacyFilters = readLegacyFilter(filter);
  const filters: CreatorTrendFilters = {
    range: legacyFilters.range ?? normalizeTrendRange(range),
    platform: legacyFilters.platform ?? normalizeTrendPlatform(platform),
    direction: normalizeDirection(legacyFilters.direction ?? direction, creatorPreference?.insightDirection ?? DEFAULT_INSIGHT_DIRECTION),
    scenario: normalizeScenario(legacyFilters.scenario ?? scenario),
    keyword: keyword?.trim() ?? legacyFilters.keyword ?? "",
  };
  const poolView = pool === "draft" ? "draft" : "watch";
  const [overview, topTopics, xiaohongshuOpportunities, allTopContents, realTrendData, analysis, settings] = await Promise.all([
    getCreatorTrendsOverview(filters.direction),
    getCreatorTopTopics(filters.direction),
    getXiaohongshuOpportunityRows(filters.direction),
    prisma.insightContent.findMany({
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: 300,
    }),
    getCreatorTrendSeries(30, filters.direction),
    getCreatorInsightAnalysis(filters.direction),
    prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
    }),
  ]);
  const currentDirection = getInsightDirection(filters.direction);
  const directionTextTerms = directionTerms(filters.direction);
  const topContents = allTopContents.filter((content) =>
    matchesDirectionText(
      `${content.title} ${content.description ?? ""} ${content.keyword ?? ""} ${JSON.stringify(content.rawPayload ?? {})}`,
      directionTextTerms,
    ),
  );
  const filteredTopContents = topContents.filter((content) => {
    const platformMatches = filters.platform === "all" || content.platform === filters.platform;
    const keywordMatches = !filters.keyword || content.title.includes(filters.keyword) || content.description?.includes(filters.keyword) || content.keyword?.includes(filters.keyword);
    return platformMatches && keywordMatches;
  });
  const scopedTopContents = filteredTopContents.length > 0 ? filteredTopContents : topContents;
  const liveComments = scopedTopContents.length
    ? await prisma.insightComment.findMany({
        where: { contentId: { in: scopedTopContents.map((content) => content.id) } },
        orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
        take: 400,
      })
    : [];
  const dailySnapshot = await prisma.creatorTrendDailySnapshot.findFirst({
    where: { direction: currentDirection.slug },
    orderBy: [{ date: "desc" }, { generatedAt: "desc" }],
  });
  const snapshotOverview = readSnapshotValue<CreatorTrendOverview>(dailySnapshot?.overview);
  const snapshotTrendData = readSnapshotValue<CreatorTrendPoint[]>(dailySnapshot?.trendSeries);
  const snapshotTopicRows = readSnapshotValue<TopicRow[]>(dailySnapshot?.topicRows);
  const snapshotRecommendationBatches = readSnapshotValue<TopicCard[][]>(dailySnapshot?.recommendationBatches) ?? [];
  const snapshotCaseStudy = readSnapshotValue<CaseStudySnapshot>(dailySnapshot?.caseStudy);
  const liveRecommendationSource = scopedTopContents.length > 3 ? scopedTopContents.slice(1) : scopedTopContents;
  const liveCommentCountMap = new Map(liveRecommendationSource.map((content) => [content.id, content.commentCount]));
  const liveCommentTextsByContentId = new Map<string, string[]>();
  for (const comment of liveComments) {
    const texts = liveCommentTextsByContentId.get(comment.contentId) ?? [];
    texts.push(comment.text);
    liveCommentTextsByContentId.set(comment.contentId, texts);
  }
  const liveRecommendationBatches = await Promise.all(Array.from({ length: Math.max(1, Math.ceil(liveRecommendationSource.length / 6)) }, async (_, index) => {
    const start = index * 6;
    const batchContents = liveRecommendationSource.slice(start, start + 6);
    const baseBatch = deriveContentRecommendations(batchContents, liveCommentCountMap, liveCommentTextsByContentId);
    return rewriteRecommendationsWithAi(baseBatch, liveCommentTextsByContentId, settings);
  }));
  const nonEmptyLiveRecommendationBatches = liveRecommendationBatches.filter((batch) => batch.length > 0);
  const hasRichSnapshotRecommendations = snapshotRecommendationBatches.some((batch) =>
    batch.some((item) => Boolean(item.coverImageUrl) && Boolean(item.id || item.sampleSourceContentId)),
  );
  const recommendationBatches =
    nonEmptyLiveRecommendationBatches.length > 0
      ? nonEmptyLiveRecommendationBatches
      : hasRichSnapshotRecommendations
      ? snapshotRecommendationBatches
      : [];
  const activeBatchIndex = positiveBatchIndex(batch, recommendationBatches.length);
  const activeNextBatchIndex = recommendationBatches.length > 1 ? (activeBatchIndex + 1) % recommendationBatches.length : 0;
  const trendDataSource = snapshotTrendData && snapshotTrendData.length >= 2 ? snapshotTrendData : realTrendData.length >= 2 ? realTrendData : trendData;
  const hasRealData = topTopics.length > 0 || scopedTopContents.length > 0 || analysis.topics.length > 0;
  const topCase = scopedTopContents[0];
  const excludedRecommendationTitle = topCase?.title ?? snapshotCaseStudy?.title;
  const trendSource: SourceKind = snapshotTrendData && snapshotTrendData.length >= 2 ? "规则计算" : realTrendData.length >= 2 ? "真实采集" : "示例兜底";
  const topicSource: SourceKind = snapshotTopicRows && snapshotTopicRows.length > 0 ? "规则计算" : topTopics.length > 0 ? "规则计算" : "示例兜底";
  const recommendationSource: SourceKind = recommendationBatches.length > 0 ? "规则计算" : analysis.recommendations.length > 0 ? "规则计算" : "示例兜底";
  const caseSource: SourceKind = topCase ? "真实采集" : snapshotCaseStudy ? "规则计算" : "示例兜底";
  const hasExampleFallback = [trendSource, topicSource, recommendationSource, caseSource].includes("示例兜底");
  const dataSourceLabel = hasRealData ? "实时计算" : dailySnapshot ? "每日快照" : "示例兜底";
  const dataSourceDetail = hasRealData
    ? "当前方向已启用实时数据优先，快照仅作为兜底。"
    : dailySnapshot
      ? `同方向达人共享，更新于 ${formatDateTime(dailySnapshot.generatedAt)}，批次 ${activeBatchIndex + 1}/${Math.max(1, recommendationBatches.length)}`
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
      ? snapshotTopicRows.map((row) => ({ ...row, source: row.source ?? "综合热榜" }))
      : topTopics.length > 0
      ? topTopics.slice(0, 8).map((row) => {
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
            source: "综合热榜",
          };
        })
      : [];
  const displayXiaohongshuRows = xiaohongshuOpportunities.map<TopicRow>((row, index) => ({
    rank: index + 1,
    topic: row.topic,
    stage: row.match >= 82 ? "爆发中" : row.match >= 68 ? "长尾可做" : "谨慎追",
    heat: `${row.heat}分`,
    match: `${row.match}%`,
    competition: row.competition as Level,
    difficulty: row.titlePotential as Level,
    platforms: ["小红书"],
    advice: row.action === "立即写" ? "立即跟" : row.action === "观察补样本" ? "可长尾" : "谨慎跟",
    source: row.source,
  }));
  const mergedTopicRows = [...displayTopicRows, ...displayXiaohongshuRows].filter((row, index, rows) => {
    const key = `${row.topic}-${row.platforms.join(",")}`;
    return rows.findIndex((candidate) => `${candidate.topic}-${candidate.platforms.join(",")}` === key) === index;
  });
  const displayRecommendations: TopicCard[] =
    recommendationBatches[activeBatchIndex]?.length > 0
      ? recommendationBatches[activeBatchIndex].map((item) => ({
          ...item,
          stage: "stage" in item && item.stage ? item.stage : item.heat.includes("分") && Number.parseInt(item.heat, 10) >= 60 ? "爆发中" : "长尾可做",
          coverImageUrl: item.coverImageUrl ?? analysis.recommendations.find((candidate) => candidate.title === item.title)?.coverImageUrl,
        }))
      : analysis.recommendations.length > 0
      ? analysis.recommendations.slice(0, 4).map((item) => ({
          id: item.id,
          title: item.title,
          stage: item.heat.includes("分") && Number.parseInt(item.heat, 10) >= 60 ? "爆发中" : "长尾可做",
          reason: item.reason,
          tags: item.tags.map(platformLabel),
          heat: item.heat,
          tone: item.tone,
          keyword: item.keyword,
          creator: item.creator,
          sampleTitle: item.sampleTitle,
          sampleContentUrl: item.sampleContentUrl,
          sampleSourceContentId: item.sampleSourceContentId,
          metrics: item.metrics,
          angles: item.angles,
          coverImageUrl: item.coverImageUrl,
        }))
      : getDirectionFallbackRecommendations(filters.direction);
  const filterMatchedRecommendations = displayRecommendations.filter((item) => {
    const platformMatches = filters.platform === "all" || item.platform === filters.platform || item.tags.includes(platformLabel(filters.platform));
    const keywordMatches =
      !filters.keyword ||
      [item.title, item.reason, item.keyword, item.sampleTitle, ...(item.tags ?? []), ...(item.angles ?? [])].filter(Boolean).some((value) => String(value).includes(filters.keyword));
    return platformMatches && keywordMatches;
  });
  const directionPlatformRecommendations = displayRecommendations.filter(
    (item) => filters.platform === "all" || item.platform === filters.platform || item.tags.includes(platformLabel(filters.platform)),
  );
  const effectiveRecommendations =
    filterMatchedRecommendations.length > 0
      ? filterMatchedRecommendations
      : directionPlatformRecommendations.length > 0
      ? directionPlatformRecommendations
      : displayRecommendations;
  const dedupedRecommendations = excludedRecommendationTitle
    ? effectiveRecommendations.filter((item) => item.title !== excludedRecommendationTitle)
    : effectiveRecommendations;
  const uniqueRecommendations = (dedupedRecommendations.length > 0 ? dedupedRecommendations : effectiveRecommendations).slice(0, 4);
  const selectedRecommendation =
    rec && uniqueRecommendations.length > 0
      ? uniqueRecommendations.find((item) => item.id === rec || item.sampleSourceContentId === rec || item.title === rec) ?? null
      : null;

  const fallbackWatchPool: WatchPoolItem[] = displayTopicRows.slice(0, 4).map((row) => ({
    topic: row.topic,
    status: row.stage === "爆发中" ? "升温中" : row.stage === "谨慎追" ? "已过热" : "观察中",
    action: row.stage === "爆发中" ? "可转草稿" : row.stage === "谨慎追" ? "暂缓" : "继续观察",
    signal: `${row.heat} / 匹配 ${row.match}`,
  }));
  const fallbackDraftPool: DraftPoolItem[] = uniqueRecommendations.slice(0, 3).map((item) => ({
    title: item.title,
    angle: item.tags[0] ? `${item.tags[0]}切入` : "热点切入",
    platforms: item.tags.slice(1, 3),
    reason: item.reason,
    status: Number.parseInt(item.heat, 10) >= 60 ? "可创作" : "待完善",
  }));
  const displayWatchPool = !topCase && snapshotCaseStudy?.watchPool?.length ? snapshotCaseStudy.watchPool : fallbackWatchPool;
  const displayDraftPool = !topCase && snapshotCaseStudy?.draftPool?.length ? snapshotCaseStudy.draftPool : fallbackDraftPool;

  const displayCaseTitle = topCase?.title ?? snapshotCaseStudy?.title ?? "油皮夏季持妆底妆实测";
  const displayCaseCover = topCase ? extractCoverImageUrl(topCase.rawPayload) : snapshotCaseStudy?.coverImageUrl;
  const displayCaseLikes = topCase ? `${topCase.likeCount.toLocaleString()}赞` : snapshotCaseStudy?.likes ?? "1.2万赞";
  const displayCaseStats = topCase
    ? [topCase.likeCount, topCase.commentCount, topCase.collectCount, topCase.shareCount].map((value) => value.toLocaleString())
    : snapshotCaseStudy?.stats ?? ["1.2万", "892", "1,045", "2,354"];
  const displayCaseRows = topCase
    ? [
        ["平台", platformLabel(topCase.platform)],
        ["关键词", topCase.keyword ?? "未标注"],
        ["作者", topCase.authorName ?? "未知作者"],
        ["互动结构", `赞 ${topCase.likeCount.toLocaleString()} / 评 ${topCase.commentCount.toLocaleString()} / 藏 ${topCase.collectCount.toLocaleString()}`],
        ["可复用模板", "热点内容拆解模板"],
      ]
    : snapshotCaseStudy?.rows ?? getDirectionFallbackCaseRows(filters.direction);
  const caseScriptText = [
    `标题：${displayCaseTitle}`,
    `方向：${currentDirection.label}`,
    ...displayCaseRows.map(([label, value]) => `${label}：${value}`),
  ].join("\n");
  const directionOptions = INSIGHT_DIRECTIONS.map((direction) => ({
    slug: direction.slug,
    label: direction.label,
    chips: [...direction.chips],
    creatorTrendLabels: [...direction.creatorTrendLabels],
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
            <CreatorTrendHeaderFilters />
          </div>
        </header>

        <main className="space-y-5 p-8">
          <CreatorTrendSearch />

          <section className={cn(cardClass, "flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between")}>
            <div>
              <p className="text-sm font-black text-slate-950">数据来源：{dataSourceLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">当前方向：{currentDirection.label} · {dataSourceDetail}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">该页展示同方向达人共享趋势池，由系统每日生成。</p>
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

          <CreatorTrendHotTopics trendData={trendDataSource} topicRows={mergedTopicRows} trendSource={trendSource} topicSource={topicSource} />

          <section id="topic-recommendations" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.9fr_0.75fr]">
            <div className={cn(cardClass, "overflow-hidden p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">AI 选题推荐</h2>
                  <SourceBadge kind={recommendationSource} />
                </div>
                <Link href={`${buildTrendHref(filters, {}, "#topic-recommendations").replace("#topic-recommendations", "")}${buildTrendHref(filters, {}, "").includes("?") ? "&" : "?"}batch=${activeNextBatchIndex}#topic-recommendations`} className="flex items-center gap-1 text-sm font-black text-teal-700">
                  <RefreshCw size={15} />换一批
                </Link>
              </div>
              <div className="-mx-1 overflow-x-auto px-1 pb-2">
                <div className="flex min-w-max gap-4">
                  {uniqueRecommendations.length > 0 ? uniqueRecommendations.map((item) => (
                    <div key={item.id ?? item.title} className="w-40 shrink-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <Link href={`${buildTrendHref(filters, {}, "#topic-recommendations").replace("#topic-recommendations", "")}${buildTrendHref(filters, {}, "").includes("?") ? "&" : "?"}batch=${activeBatchIndex}&rec=${encodeURIComponent(item.id ?? item.sampleSourceContentId ?? item.title)}#topic-recommendations`} className="block">
                        <div className={cn("relative mb-3 h-24 overflow-hidden rounded-lg bg-gradient-to-br", item.tone)}>
                        {item.coverImageUrl ? (
                          <Image
                            alt={item.title}
                            className="object-cover"
                            fill
                            sizes="160px"
                            src={item.coverImageUrl}
                            unoptimized
                          />
                        ) : null}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 font-black">{item.title}</p>
                          <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", stageClass(item.stage))}>{item.stage}</span>
                        </div>
                      </Link>
                      <p className="mt-3 text-xs font-black text-slate-500">推荐理由</p>
                      <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.reason}</p>
                      <div className="mt-3 flex flex-wrap gap-2">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="whitespace-nowrap rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">{tag}</span>)}</div>
                      <p className="mt-3 text-sm font-black text-red-500">预计热度 {item.heat}</p>
                      <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-xs font-black text-slate-500">方向切入角度</p>
                    </div>
                  )) : (
                    <div className="flex h-40 min-w-96 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-sm font-semibold text-slate-400">
                      当前筛选下暂无推荐，试试切换平台或清空关键词。
                    </div>
                  )}
                </div>
              </div>
              {selectedRecommendation ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">推荐详情</p>
                      <h3 className="mt-2 text-lg font-black text-slate-950">{selectedRecommendation.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{selectedRecommendation.reason}</p>
                    </div>
                    <Link href={`${buildTrendHref(filters, {}, "#topic-recommendations").replace("#topic-recommendations", "")}${buildTrendHref(filters, {}, "").includes("?") ? "&" : "?"}batch=${activeBatchIndex}#topic-recommendations`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 transition hover:text-slate-700">
                      关闭
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[10rem_1fr]">
                    <div className={cn("relative h-40 overflow-hidden rounded-xl bg-gradient-to-br", selectedRecommendation.tone)}>
                      {selectedRecommendation.coverImageUrl ? (
                        <Image alt={selectedRecommendation.title} className="object-cover" fill sizes="160px" src={selectedRecommendation.coverImageUrl} unoptimized />
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm"><span className="font-bold text-slate-500">参考样本</span><p className="mt-1 font-black text-slate-900">{selectedRecommendation.sampleTitle ?? "暂无"}</p></div>
                        <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm"><span className="font-bold text-slate-500">关键词 / 平台</span><p className="mt-1 font-black text-slate-900">{selectedRecommendation.keyword ?? "内容样本"} / {platformLabel(selectedRecommendation.tags[1] ?? selectedRecommendation.platform ?? "")}</p></div>
                        <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm"><span className="font-bold text-slate-500">参考作者</span><p className="mt-1 font-black text-slate-900">{selectedRecommendation.creator ?? "未知作者"}</p></div>
                        <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm"><span className="font-bold text-slate-500">互动结构</span><p className="mt-1 font-black text-slate-900">赞 {selectedRecommendation.metrics?.likes?.toLocaleString() ?? 0} / 评 {selectedRecommendation.metrics?.comments?.toLocaleString() ?? 0} / 藏 {selectedRecommendation.metrics?.collects?.toLocaleString() ?? 0}</p></div>
                      </div>
                      <div className="rounded-xl border border-white bg-white px-3 py-3 text-sm">
                        <p className="font-bold text-slate-500">可延展角度</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(selectedRecommendation.angles ?? []).map((angle) => (
                            <span key={angle} className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">
                              {angle}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {selectedRecommendation.sampleContentUrl ? (
                          <Link href={selectedRecommendation.sampleContentUrl} target="_blank" className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100">
                            查看原帖
                          </Link>
                        ) : null}
                        <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500">样本 ID：{selectedRecommendation.sampleSourceContentId ?? selectedRecommendation.id ?? "暂无"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div id="case-study" className={cn(cardClass, "scroll-mt-28 p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">爆款案例拆解</h2>
                  <SourceBadge kind={caseSource} />
                </div>
                <Link href={buildTrendHref(filters, { keyword: "" }, "#case-study")} className="text-sm font-black text-blue-600 hover:text-blue-700">查看更多</Link>
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-4">
                <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 to-stone-200">
                  {displayCaseCover ? (
                    <Image
                      alt={displayCaseTitle}
                      className="object-cover"
                      fill
                      sizes="112px"
                      src={displayCaseCover}
                      unoptimized
                    />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 flex items-end p-2">
                    <span className="rounded-full bg-stone-700 px-2 py-1 text-xs font-black text-white">{displayCaseLikes}</span>
                  </div>
                </div>
                <div className={cn(poolView !== "watch" && "hidden")}>
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
                <Link href={buildTrendHref(filters, { keyword: getDirectionCaseTemplateKeyword(filters.direction) }, "#task-flow")} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100">{getDirectionCaseTemplateKeyword(filters.direction)}</Link>
                <CopyScriptButton text={caseScriptText} />
              </div>
            </div>

            <div id="task-flow" className={cn(cardClass, "scroll-mt-28 p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">方向趋势池</h2>
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">可筛选</span>
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Link
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-black transition",
                      poolView === "watch" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-700",
                    )}
                    href={buildTrendHrefWithExtra(filters, {}, { pool: "watch" }, "#task-flow")}
                  >
                    方向观察池
                  </Link>
                  <Link
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-black transition",
                      poolView === "draft" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-700",
                    )}
                    href={buildTrendHrefWithExtra(filters, {}, { pool: "draft" }, "#task-flow")}
                  >
                    方向选题草稿池
                  </Link>
                </div>
                <span className="text-xs font-bold text-slate-400">{poolView === "watch" ? currentDirection.label : "系统生成"}</span>
              </div>
              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                <div className={cn(poolView !== "draft" && "hidden")}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black text-slate-700">方向观察池</p>
                    <span className="text-xs font-bold text-slate-400">{currentDirection.label}</span>
                  </div>
                  <div className="space-y-3">
                    {displayWatchPool.map((item) => (
                      <div key={`${item.topic}-${item.status}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <Link className="line-clamp-2 text-sm font-black transition hover:text-teal-700" href={buildTrendHref(filters, { keyword: item.topic }, "#topic-recommendations")}>{item.topic}</Link>
                          <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", poolStatusClass(item.status))}>{item.status}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                          <span>{item.signal}</span>
                          <Link className="text-teal-700 hover:text-teal-800" href={buildTrendHref(filters, { keyword: item.topic }, item.action === "暂缓" ? "#case-study" : "#topic-recommendations")}>{item.action}</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black text-slate-700">方向选题草稿池</p>
                    <span className="text-xs font-bold text-slate-400">系统生成</span>
                  </div>
                  <div className="space-y-3">
                    {displayDraftPool.map((item) => (
                      <div key={`${item.title}-${item.angle}`} className="rounded-xl border border-slate-100 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <Link className="line-clamp-2 text-sm font-black transition hover:text-teal-700" href={buildTrendHref(filters, { keyword: item.title }, "#topic-recommendations")}>{item.title}</Link>
                          <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", poolStatusClass(item.status))}>{item.status}</span>
                        </div>
                        <p className="mt-2 text-xs font-black text-teal-700">{item.angle}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{item.reason}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.platforms.slice(0, 3).map((platform) => <PlatformBadge key={platform} label={platform} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      </CreatorTrendFilterProvider>
    </>
  );
}
