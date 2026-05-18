import { getOrGenerateAiTopicDeck } from "@/lib/insights/ai-topic-deck";
import { invalidateInsightCache, withSharedInsightCache } from "@/lib/insights/cache";
import type { InsightConfidence, InsightSourceKind } from "@/lib/insights/credibility";
import { DEFAULT_INSIGHT_DIRECTION, getInsightDirection, getInsightDirectionTerms } from "@/lib/insights/directions";
import { getCreatorTopTopics, getXiaohongshuOpportunityRows } from "@/lib/insights/queries";
import { prisma } from "@/lib/prisma";
import { extractCoverImageUrl } from "@/lib/tikhub/mappers";

export type SourceKind = InsightSourceKind;
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
  sampleCoverImageUrl?: string;
  evidenceSummary?: string;
  referenceSourceContentIds?: string[];
  metrics?: {
    likes: number;
    comments: number;
    collects: number;
    shares: number;
  };
  angles?: string[];
  coverImageUrl?: string;
  coverImagePrompt?: string;
  coverNegativePrompt?: string;
  updatedAt?: string;
  sampleCount?: number;
  commentSampleCount?: number;
  platformSourceCount?: number;
  confidence?: InsightConfidence;
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
  updatedAt?: string;
  sampleCount?: number;
  commentSampleCount?: number;
  platformSourceCount?: number;
  confidence?: InsightConfidence;
  reason?: string;
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
  recommendationStatus?: "READY" | "FAILED";
  recommendationError?: string | null;
  recommendationGeneratedAt?: string | null;
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
    graphicScriptText: string;
    videoScriptText: string;
    templateKeyword: string;
  };
};

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

function buildWatchPool(rows: TopicRow[]): WatchPoolItem[] {
  return rows.slice(0, 4).map<WatchPoolItem>((row) => ({
    topic: row.topic,
    status: row.stage === "爆发中" ? "升温中" : row.stage === "谨慎跟进" ? "已过热" : "观察中",
    action: row.stage === "爆发中" ? "可转草稿" : row.stage === "谨慎跟进" ? "暂缓" : "继续观察",
    signal: `${row.heat} / 匹配 ${row.match}${row.sampleCount ? ` / 样本 ${row.sampleCount}` : ""}`,
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
      updatedAt: row.updatedAt,
      sampleCount: row.sampleCount,
      commentSampleCount: row.commentSampleCount,
      platformSourceCount: row.platformSourceCount,
      confidence: row.confidence,
      reason: row.reason,
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
    updatedAt: row.updatedAt,
    sampleCount: row.sampleCount,
    commentSampleCount: row.commentSampleCount,
    platformSourceCount: row.platformSourceCount,
    confidence: row.confidence,
    reason: row.reason,
  }));

  return [...primaryRows, ...extraRows].filter((row, index, rows) => {
    const key = `${row.topic}-${row.platforms.join(",")}`;
    return rows.findIndex((candidate) => `${candidate.topic}-${candidate.platforms.join(",")}` === key) === index;
  });
}

async function loadCreatorTrendDetailData(filters: CreatorTrendDetailFilters, options: { forceAiRecommendations?: boolean } = {}): Promise<CreatorTrendDetailData> {
  const direction = filters.direction || DEFAULT_INSIGHT_DIRECTION;
  const currentDirection = getInsightDirection(direction);
  const directionTextTerms = getInsightDirectionTerms(direction);
  const [topTopics, xiaohongshuOpportunities, allTopContents, dailySnapshot, aiSettings] = await Promise.all([
    getCreatorTopTopics(direction),
    getXiaohongshuOpportunityRows(direction),
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
    prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
      select: {
        insightAiEnabled: true,
        insightAiBaseUrl: true,
        insightAiApiKey: true,
        insightAiModel: true,
        insightAiSystemPrompt: true,
        insightAiScriptSystemPrompt: true,
        insightAiGraphicScriptSystemPrompt: true,
        insightAiVideoScriptSystemPrompt: true,
      },
    }),
  ]);

  const snapshotCaseStudy = readSnapshotValue<CaseStudySnapshot>(dailySnapshot?.caseStudy);
  const topContents = allTopContents.filter((content) => matchesDirectionText(contentDirectionText(content), directionTextTerms));
  const filteredTopContents = topContents.filter((content) => {
    const platformMatches = filters.platform === "all" || content.platform === filters.platform;
    const keywordMatches =
      !filters.keyword || content.title.includes(filters.keyword) || content.description?.includes(filters.keyword) || content.keyword?.includes(filters.keyword);
    return platformMatches && keywordMatches;
  });
  const scopedTopContents = filteredTopContents.length > 0 ? filteredTopContents : topContents;
  const scopedTopContentsWithCover = scopedTopContents.filter((content) => Boolean(extractCoverImageUrl(content.rawPayload)));
  const liveComments = scopedTopContents.length
    ? await prisma.insightComment.findMany({
        where: { contentId: { in: scopedTopContents.map((content) => content.id) } },
        select: { contentId: true, text: true },
        orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
        take: LIVE_COMMENT_LIMIT,
      })
    : [];

  const recommendationSourceBase = scopedTopContentsWithCover.length >= 4 ? scopedTopContentsWithCover : scopedTopContents;
  const liveRecommendationSourceSeed = recommendationSourceBase.length > 3 ? recommendationSourceBase.slice(1) : recommendationSourceBase;
  const liveRecommendationSource = liveRecommendationSourceSeed.slice(0, LIVE_RECOMMENDATION_SOURCE_LIMIT);
  const liveCommentTextsByContentId = new Map<string, string[]>();
  for (const comment of liveComments) {
    const texts = liveCommentTextsByContentId.get(comment.contentId) ?? [];
    texts.push(comment.text);
    liveCommentTextsByContentId.set(comment.contentId, texts);
  }

  const aiTopicDeck = await getOrGenerateAiTopicDeck({
    direction,
    directionLabel: currentDirection.label,
    platform: filters.platform,
    keyword: filters.keyword,
    sourceContents: liveRecommendationSource,
    commentsByContentId: liveCommentTextsByContentId,
    settings: aiSettings,
    force: options.forceAiRecommendations,
  });
  const baseLiveRecommendationBatches =
    aiTopicDeck.status === "READY"
      ? Array.from({ length: Math.ceil(aiTopicDeck.items.length / 3) }, (_, index) => aiTopicDeck.items.slice(index * 3, index * 3 + 3)).filter(
          (batch) => batch.length > 0,
        )
      : [];
  const liveRecommendationsUsedAi = aiTopicDeck.status === "READY";

  const rawRecommendationBatches = baseLiveRecommendationBatches.length > 0 ? baseLiveRecommendationBatches : [];

  const topCase = scopedTopContentsWithCover[0] ?? scopedTopContents[0];
  const excludedRecommendationTitle = topCase?.title ?? snapshotCaseStudy?.title;
  const recommendationBatches = rawRecommendationBatches
    .map((batch) => {
      const deduped = excludedRecommendationTitle ? batch.filter((item) => item.title !== excludedRecommendationTitle) : batch;
      return deduped.length > 0 ? deduped : batch;
    })
    .filter((batch) => batch.length > 0);

  const effectiveRecommendationBatches = recommendationBatches;
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
  const fallbackScriptText = [
    `选题标题：${caseTitle}`,
    `适合平台：${topCase ? platformLabel(topCase.platform) : filters.platform === "all" ? "小红书 / 抖音" : platformLabel(filters.platform)}`,
    `内容目标：借势 ${currentDirection.label} 热点，完成真实体验种草`,
    "",
    "0-3秒 Hook：先抛出用户最关心的问题或反差结论。",
    "3-8秒 痛点放大：说明为什么这个问题最近被频繁讨论。",
    "8-20秒 体验过程：展示真实使用、对比或步骤。",
    "20-35秒 证据细节：补充互动样本、评论痛点或关键细节。",
    "35-45秒 总结 CTA：给出适合/不适合人群，并引导评论或主页链接。",
    "",
    ...caseRows.map(([label, value]) => `${label}：${value}`),
  ].join("\n");
  const fallbackGraphicScriptText = [
    "【图文脚本】",
    `选题标题：${caseTitle}`,
    `适合平台：${topCase ? platformLabel(topCase.platform) : filters.platform === "all" ? "小红书 / 抖音" : platformLabel(filters.platform)}`,
    `内容目标：借势 ${currentDirection.label} 热点，做成可收藏、可评论的图文笔记。`,
    "",
    "图文分页结构：",
    "封面：用真实场景图或结果对比图，标题写清楚痛点和结果。",
    "图片生成提示词：竖版小红书封面图，真实生活方式摄影，主体和结果形成明确对比，上方保留标题留白，自然柔光，清爽干净，高质感，真实摄影风格。",
    "负向提示词：不要生成中文文字，不要水印，不要品牌 logo，不要夸张广告海报风，不要杂乱背景，不要低清晰度。",
    "建议画幅：3:4",
    "生图备注：标题、标签和正文由前端叠加；画面必须保留可叠字留白。",
    "第 2 页：放大用户痛点，解释为什么这个问题最近被反复讨论。",
    "图片生成提示词：竖版真实生活场景图，展示用户遇到的具体痛点，主体清晰，背景简洁，侧边保留留白用于叠加痛点文字，真实记录感。",
    "负向提示词：不要生成文字，不要过度摆拍，不要虚构品牌，不要手部畸形，不要强滤镜。",
    "建议画幅：3:4",
    "生图备注：适合前端叠加 01 编号和痛点短句。",
    "第 3 页：展示第一组真实体验、步骤或细节。",
    "图片生成提示词：竖版教程步骤图，展示一个具体动作或关键细节，手部动作自然，物品摆放有序，画面留白适合加编号和箭头。",
    "负向提示词：不要复杂背景，不要多人抢主体，不要过曝，不要生成水印或品牌 logo。",
    "建议画幅：3:4",
    "生图备注：适合前端叠加步骤编号和箭头标注。",
    "第 4 页：展示第二组对比、避坑或评论里高频追问。",
    "图片生成提示词：竖版对比图，同一场景下展示前后差异或优缺点对照，左右分区明确，主体一致，真实摄影风格。",
    "负向提示词：不要强烈滤镜，不要商业广告质感，不要文字乱码，不要画面拥挤。",
    "建议画幅：3:4",
    "生图备注：适合前端叠加左右对比标签。",
    "第 5 页：总结适合/不适合人群，给出收藏清单。",
    "图片生成提示词：竖版清单背景图，干净浅色背景，主体物品整齐摆放，下方或中间留出大面积空白，适合叠加 checklist 文案。",
    "负向提示词：不要复杂纹理，不要深色压抑背景，不要生成错误文字，不要低质感拼贴。",
    "建议画幅：3:4",
    "生图备注：清单文字由前端叠加，保证可读性。",
    "",
    "发布文案：围绕真实体验展开，不做绝对化承诺，结尾引导评论补充使用场景。",
    "互动引导：你最近也遇到过类似问题吗？评论区说一个场景。",
  ].join("\n");
  const fallbackVideoScriptText = [
    "【视频脚本】",
    fallbackScriptText,
    "",
    "voiceover_script（时间为 estimated，最终以 TTS 对齐为准）：",
    "0-3s / v01 / hook：先抛出用户最关心的问题或反差结论。",
    "3-8s / v02 / pain：说明为什么这个问题最近被频繁讨论。",
    "8-22s / v03 / process：展示真实使用、对比或步骤，不要只讲结论。",
    "22-42s / v04 / proof：补充评论痛点、关键细节和避坑提醒。",
    "42-55s / v05 / cta：总结适合和不适合人群，引导评论或收藏。",
  ].join("\n");
  const caseScriptPack = {
    graphicScriptText: fallbackGraphicScriptText,
    videoScriptText: fallbackVideoScriptText,
    scriptText: `${fallbackGraphicScriptText}\n\n${fallbackVideoScriptText}`,
  };

  return {
    recommendationSource:
      liveRecommendationsUsedAi
        ? "AI生成"
        : "示例兜底",
    recommendationStatus: aiTopicDeck.status,
    recommendationError: aiTopicDeck.errorMessage,
    recommendationGeneratedAt: aiTopicDeck.generatedAt,
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
      scriptText: caseScriptPack.scriptText,
      graphicScriptText: caseScriptPack.graphicScriptText,
      videoScriptText: caseScriptPack.videoScriptText,
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

export async function regenerateCreatorTrendAiRecommendations(filters: CreatorTrendDetailFilters): Promise<CreatorTrendDetailData> {
  const normalizedFilters: CreatorTrendDetailFilters = {
    direction: filters.direction || DEFAULT_INSIGHT_DIRECTION,
    platform: filters.platform,
    keyword: filters.keyword.trim(),
  };
  await invalidateInsightCache({ namespace: "creator-trend-detail" });
  return loadCreatorTrendDetailData(normalizedFilters, { forceAiRecommendations: true });
}
