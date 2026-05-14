import { deriveContentRecommendations, type RecommendationSummary } from "@/lib/insights/analysis";
import { getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";
import { withSharedInsightCache } from "@/lib/insights/cache";
import { DEFAULT_INSIGHT_DIRECTION, getInsightDirection, getInsightDirectionTerms } from "@/lib/insights/directions";
import { getCreatorTopTopics, getXiaohongshuOpportunityRows } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";
import { extractCoverImageUrl } from "@/lib/tikhub/mappers";

export type SourceKind = "真实采集" | "规则计算" | "示例兜底";
export type TopicStage = "爆发中" | "长尾可做" | "谨慎跟进";

export type TopicCard = {
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

export type WatchPoolItem = {
  topic: string;
  status: "升温中" | "观察中" | "已过热";
  action: "继续观察" | "可转草稿" | "暂缓";
  signal: string;
};

export type DraftPoolItem = {
  title: string;
  angle: string;
  platforms: string[];
  reason: string;
  status: "待完善" | "可创作" | "已过热";
};

type TopicRow = {
  rank: number;
  topic: string;
  stage: TopicStage;
  heat: string;
  match: string;
  competition: "低" | "中" | "高";
  difficulty: "低" | "中" | "高";
  platforms: string[];
  advice: "立即跟进" | "可长期做" | "谨慎跟进";
  source?: string;
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

export type CreatorTrendDetailFilters = {
  direction: string;
  platform: "all" | "xiaohongshu" | "douyin" | "weibo" | "bilibili";
  keyword: string;
};

export type CreatorTrendDetailData = {
  recommendationSource: SourceKind;
  caseSource: SourceKind;
  recommendationBatches: TopicCard[][];
  watchPool: WatchPoolItem[];
  draftPools: DraftPoolItem[][];
  caseStudy: {
    title: string;
    coverImageUrl?: string;
    likes: string;
    stats: string[];
    rows: [string, string][];
    scriptText: string;
    templateKeyword: string;
  };
};

const REC_BATCH_SIZE = 6;
const LIVE_TOP_CONTENT_LIMIT = 180;
const LIVE_RECOMMENDATION_SOURCE_LIMIT = 24;
const LIVE_COMMENT_LIMIT = 240;
const LIVE_CONTENT_LOOKBACK_DAYS = 30;
const DETAIL_SERVER_CACHE_MAX = 300;
const DETAIL_SERVER_CACHE_TTL_MS = 45_000;

async function withDetailServerCache(key: string, loader: () => Promise<CreatorTrendDetailData>) {
  return withSharedInsightCache({
    namespace: "creator-trend-detail",
    key,
    ttlMs: DETAIL_SERVER_CACHE_TTL_MS,
    maxEntries: DETAIL_SERVER_CACHE_MAX,
    loader,
  });
}

function detailServerCacheKey(filters: CreatorTrendDetailFilters) {
  return JSON.stringify({
    direction: filters.direction || DEFAULT_INSIGHT_DIRECTION,
    platform: filters.platform,
    keyword: filters.keyword.trim(),
  });
}

const fallbackRecommendations: TopicCard[] = [
  { title: "油皮夏天的底妆救星", stage: "爆发中", reason: "油皮痛点强，搜索增长快。", tags: ["美妆测评", "油皮护肤", "成分党"], heat: "86分", tone: "from-orange-100 to-amber-50" },
  { title: "早C晚A搭配思路", stage: "长尾可做", reason: "新手关注高，适合知识型讲解。", tags: ["护肤干货", "成分党", "新手友好"], heat: "48分", tone: "from-sky-100 to-cyan-50" },
  { title: "新手眼妆公式", stage: "爆发中", reason: "眼妆教程需求大，转化较好。", tags: ["彩妆教程", "新手友好", "学生党"], heat: "48分", tone: "from-rose-100 to-pink-50" },
  { title: "高倍防晒测评合集", stage: "长尾可做", reason: "防晒季持续热搜，适合合集内容。", tags: ["防晒测评", "成分党", "实测党"], heat: "38分", tone: "from-blue-100 to-sky-50" },
];

const fallbackRecommendationsByDirection: Record<string, TopicCard[]> = {
  beauty: fallbackRecommendations,
  fashion: [
    { title: "通勤衬衫怎么穿不垮", stage: "爆发中", reason: "通勤场景需求稳定，评论区求链接高。", tags: ["穿搭测评", "通勤穿搭", "显瘦技巧"], heat: "82分", tone: "from-amber-100 to-orange-50" },
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
  ["评论需求", "求色号 / 求链接 / 肤质建议"],
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

export function getDirectionCaseTemplateKeyword(directionSlug: string) {
  if (directionSlug === "fashion") return "通勤穿搭测评模板";
  if (directionSlug === "food") return "低卡食品测评模板";
  return "底妆测评模板";
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

function toDifficulty(heatScore: number) {
  if (heatScore >= 80) return "高";
  if (heatScore >= 50) return "中";
  return "低";
}

function readSnapshotValue<T>(value: unknown): T | null {
  if (value == null) return null;
  return value as T;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function contentDirectionText(content: { title: string; description?: string | null; keyword?: string | null }) {
  return `${content.title} ${content.description ?? ""} ${content.keyword ?? ""}`;
}

function matchesDirectionText(text: string, terms: string[]) {
  if (terms.length === 0) return true;
  return terms.some((term) => text.includes(term));
}

function mapRecommendationItem(item: RecommendationSummary): TopicCard {
  return {
    id: item.id,
    title: item.title,
    stage: item.heat.includes("分") && Number.parseInt(item.heat, 10) >= 60 ? "爆发中" : "长尾可做",
    reason: item.reason,
    platform: item.platform,
    tags: item.tags.map((tag) => (["xiaohongshu", "douyin", "weibo", "bilibili"].includes(tag) ? platformLabel(tag) : tag)),
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
  };
}

function buildWatchPool(rows: TopicRow[]): WatchPoolItem[] {
  return rows.slice(0, 4).map<WatchPoolItem>((row) => ({
    topic: row.topic,
    status: row.stage === "爆发中" ? "升温中" : row.stage === "谨慎跟进" ? "已过热" : "观察中",
    action: row.stage === "爆发中" ? "可转草稿" : row.stage === "谨慎跟进" ? "暂缓" : "继续观察",
    signal: `${row.heat} / 匹配 ${row.match}`,
  }));
}

function buildDraftPool(recommendations: TopicCard[]): DraftPoolItem[] {
  return recommendations.slice(0, 3).map<DraftPoolItem>((item) => ({
    title: item.title,
    angle: item.tags[0] ? `${item.tags[0]}切入` : "热点切入",
    platforms: item.platform ? [platformLabel(item.platform)] : item.tags.slice(1, 3),
    reason: item.reason,
    status: Number.parseInt(item.heat, 10) >= 60 ? "可创作" : "待完善",
  }));
}

function normalizeTopicRows(
  topTopics: Awaited<ReturnType<typeof getCreatorTopTopics>>,
  xiaohongshuRows: Awaited<ReturnType<typeof getXiaohongshuOpportunityRows>>,
) {
  const primaryRows: TopicRow[] = topTopics.slice(0, 8).map((row) => {
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
      advice: row.heatScore >= 70 ? "立即跟进" : row.heatScore >= 45 ? "可长期做" : "谨慎跟进",
      source: "综合热榜",
    };
  });

  const extraRows: TopicRow[] = xiaohongshuRows.map((row, index) => ({
    rank: index + 1,
    topic: row.topic,
    stage: row.match >= 82 ? "爆发中" : row.match >= 68 ? "长尾可做" : "谨慎跟进",
    heat: `${row.heat}分`,
    match: `${row.match}%`,
    competition: row.competition as "低" | "中" | "高",
    difficulty: row.titlePotential as "低" | "中" | "高",
    platforms: ["小红书"],
    advice: row.action === "立即做" ? "立即跟进" : row.action === "观察补样本" ? "可长期做" : "谨慎跟进",
    source: row.source,
  }));

  return [...primaryRows, ...extraRows].filter((row, index, rows) => {
    const key = `${row.topic}-${row.platforms.join(",")}`;
    return rows.findIndex((candidate) => `${candidate.topic}-${candidate.platforms.join(",")}` === key) === index;
  });
}

async function loadCreatorTrendDetailData(filters: CreatorTrendDetailFilters): Promise<CreatorTrendDetailData> {
  const direction = filters.direction || DEFAULT_INSIGHT_DIRECTION;
  const currentDirection = getInsightDirection(direction);
  const directionTextTerms = getInsightDirectionTerms(direction);
  const [topTopics, xiaohongshuOpportunities, analysis, allTopContents, dailySnapshot] = await Promise.all([
    getCreatorTopTopics(direction),
    getXiaohongshuOpportunityRows(direction),
    getCreatorInsightAnalysis(direction),
    prisma.insightContent.findMany({
      where: {
        createdAt: { gte: daysAgo(LIVE_CONTENT_LOOKBACK_DAYS) },
      },
      orderBy: [{ heatScore: "desc" }, { updatedAt: "desc" }],
      take: LIVE_TOP_CONTENT_LIMIT,
    }),
    prisma.creatorTrendDailySnapshot.findFirst({
      where: { direction: currentDirection.slug },
      orderBy: [{ date: "desc" }, { generatedAt: "desc" }],
    }),
  ]);

  const snapshotRecommendationBatches = readSnapshotValue<TopicCard[][]>(dailySnapshot?.recommendationBatches) ?? [];
  const snapshotCaseStudy = readSnapshotValue<CaseStudySnapshot>(dailySnapshot?.caseStudy);
  const topContents = allTopContents.filter((content) => matchesDirectionText(contentDirectionText(content), directionTextTerms));
  const filteredTopContents = topContents.filter((content) => {
    const platformMatches = filters.platform === "all" || content.platform === filters.platform;
    const keywordMatches =
      !filters.keyword || content.title.includes(filters.keyword) || content.description?.includes(filters.keyword) || content.keyword?.includes(filters.keyword);
    return platformMatches && keywordMatches;
  });
  const scopedTopContents = filteredTopContents.length > 0 ? filteredTopContents : topContents;
  const liveComments = scopedTopContents.length
    ? await prisma.insightComment.findMany({
        where: { contentId: { in: scopedTopContents.map((content) => content.id) } },
        select: { contentId: true, text: true },
        orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
        take: LIVE_COMMENT_LIMIT,
      })
    : [];

  const liveRecommendationSourceSeed = scopedTopContents.length > 3 ? scopedTopContents.slice(1) : scopedTopContents;
  const liveRecommendationSource = liveRecommendationSourceSeed.slice(0, LIVE_RECOMMENDATION_SOURCE_LIMIT);
  const liveCommentCountMap = new Map(liveRecommendationSource.map((content) => [content.id, content.commentCount]));
  const liveCommentTextsByContentId = new Map<string, string[]>();
  for (const comment of liveComments) {
    const texts = liveCommentTextsByContentId.get(comment.contentId) ?? [];
    texts.push(comment.text);
    liveCommentTextsByContentId.set(comment.contentId, texts);
  }

  const baseLiveRecommendationBatches = Array.from(
    { length: Math.max(1, Math.ceil(liveRecommendationSource.length / REC_BATCH_SIZE)) },
    (_, index) => {
      const start = index * REC_BATCH_SIZE;
      const batchContents = liveRecommendationSource.slice(start, start + REC_BATCH_SIZE);
      return deriveContentRecommendations(batchContents, liveCommentCountMap, liveCommentTextsByContentId).map(mapRecommendationItem);
    },
  ).filter((batch) => batch.length > 0);

  const hasRichSnapshotRecommendations = snapshotRecommendationBatches.some((batch) =>
    batch.some((item) => Boolean(item.coverImageUrl) && Boolean(item.id || item.sampleSourceContentId)),
  );

  const rawRecommendationBatches =
    baseLiveRecommendationBatches.length > 0
      ? baseLiveRecommendationBatches
      : analysis.recommendations.length > 0
      ? [analysis.recommendations.slice(0, 4).map(mapRecommendationItem)]
      : hasRichSnapshotRecommendations
      ? snapshotRecommendationBatches
      : [getDirectionFallbackRecommendations(direction)];

  const topCase = scopedTopContents[0];
  const excludedRecommendationTitle = topCase?.title ?? snapshotCaseStudy?.title;
  const recommendationBatches = rawRecommendationBatches
    .map((batch) => {
      const filterMatched = batch.filter((item) => {
        const platformMatches = filters.platform === "all" || item.platform === filters.platform || item.tags.includes(platformLabel(filters.platform));
        const keywordMatches =
          !filters.keyword ||
          [item.title, item.reason, item.keyword, item.sampleTitle, ...(item.tags ?? []), ...(item.angles ?? [])]
            .filter(Boolean)
            .some((value) => String(value).includes(filters.keyword));
        return platformMatches && keywordMatches;
      });
      const platformMatched = batch.filter(
        (item) => filters.platform === "all" || item.platform === filters.platform || item.tags.includes(platformLabel(filters.platform)),
      );
      const effective = filterMatched.length > 0 ? filterMatched : platformMatched.length > 0 ? platformMatched : batch;
      const deduped = excludedRecommendationTitle ? effective.filter((item) => item.title !== excludedRecommendationTitle) : effective;
      return (deduped.length > 0 ? deduped : effective).slice(0, 4);
    })
    .filter((batch) => batch.length > 0);

  const effectiveRecommendationBatches = recommendationBatches.length > 0 ? recommendationBatches : [getDirectionFallbackRecommendations(direction)];
  const topicRows = normalizeTopicRows(topTopics, xiaohongshuOpportunities);
  const watchPool = !topCase && snapshotCaseStudy?.watchPool?.length ? snapshotCaseStudy.watchPool : buildWatchPool(topicRows);
  const draftPools =
    effectiveRecommendationBatches.length > 0
      ? effectiveRecommendationBatches.map((batch) => buildDraftPool(batch))
      : snapshotCaseStudy?.draftPool?.length
      ? [snapshotCaseStudy.draftPool]
      : [buildDraftPool(getDirectionFallbackRecommendations(direction))];

  const caseTitle = topCase?.title ?? snapshotCaseStudy?.title ?? "油皮夏季持妆底妆实测";
  const caseCover = topCase ? extractCoverImageUrl(topCase.rawPayload) : snapshotCaseStudy?.coverImageUrl;
  const caseLikes = topCase ? `${topCase.likeCount.toLocaleString()}赞` : snapshotCaseStudy?.likes ?? "1.2万赞";
  const caseStats = topCase
    ? [topCase.likeCount, topCase.commentCount, topCase.collectCount, topCase.shareCount].map((value) => value.toLocaleString())
    : snapshotCaseStudy?.stats ?? ["1.2万", "892", "1,045", "2,354"];
  const caseRows: [string, string][] = topCase
    ? [
        ["平台", platformLabel(topCase.platform)],
        ["关键词", topCase.keyword ?? "未标注"],
        ["作者", topCase.authorName ?? "未知作者"],
        ["互动结构", `赞 ${topCase.likeCount.toLocaleString()} / 评 ${topCase.commentCount.toLocaleString()} / 藏 ${topCase.collectCount.toLocaleString()}`],
        ["可复用模板", "热点内容拆解模板"],
      ]
    : snapshotCaseStudy?.rows ?? getDirectionFallbackCaseRows(direction);
  const caseScriptText = [`标题：${caseTitle}`, `方向：${currentDirection.label}`, ...caseRows.map(([label, value]) => `${label}：${value}`)].join("\n");

  return {
    recommendationSource:
      baseLiveRecommendationBatches.length > 0 || analysis.recommendations.length > 0 || hasRichSnapshotRecommendations ? "规则计算" : "示例兜底",
    caseSource: topCase ? "真实采集" : snapshotCaseStudy ? "规则计算" : "示例兜底",
    recommendationBatches: effectiveRecommendationBatches,
    watchPool,
    draftPools,
    caseStudy: {
      title: caseTitle,
      coverImageUrl: caseCover,
      likes: caseLikes,
      stats: caseStats,
      rows: caseRows,
      scriptText: caseScriptText,
      templateKeyword: getDirectionCaseTemplateKeyword(direction),
    },
  };
}

export async function getCreatorTrendDetailData(filters: CreatorTrendDetailFilters): Promise<CreatorTrendDetailData> {
  const normalizedFilters: CreatorTrendDetailFilters = {
    direction: filters.direction || DEFAULT_INSIGHT_DIRECTION,
    platform: filters.platform,
    keyword: filters.keyword.trim(),
  };
  return withDetailServerCache(detailServerCacheKey(normalizedFilters), () => loadCreatorTrendDetailData(normalizedFilters));
}
