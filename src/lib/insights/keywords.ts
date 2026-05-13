import { prisma } from "@/lib/prisma";
import { TIKHUB_ENDPOINTS, type TikHubEndpointKey } from "@/lib/tikhub/endpoints";

type KeywordSeed = {
  keyword: string;
  keywordType: string;
  platform?: string;
  endpoint?: TikHubEndpointKey;
  priority?: number;
  perRunLimit?: number;
  collectIntervalHours?: number;
};

const DEFAULT_KEYWORDS: KeywordSeed[] = [
  // Beauty
  { keyword: "防晒", keywordType: "品类词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 10 },
  { keyword: "底妆", keywordType: "品类词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 12 },
  { keyword: "敏感肌", keywordType: "人群词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 14 },
  { keyword: "油皮", keywordType: "人群词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 16 },
  { keyword: "持妆", keywordType: "卖点词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 18 },
  { keyword: "防晒", keywordType: "品类词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 20 },
  { keyword: "底妆", keywordType: "品类词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 22 },
  { keyword: "油皮", keywordType: "人群词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 24 },

  // Mother-baby
  { keyword: "纸尿裤", keywordType: "品类词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 30 },
  { keyword: "奶粉", keywordType: "品类词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 32 },
  { keyword: "宝宝辅食", keywordType: "场景词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 34 },
  { keyword: "亲子出行", keywordType: "场景词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 36 },
  { keyword: "纸尿裤", keywordType: "品类词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 38 },
  { keyword: "奶粉", keywordType: "品类词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 40 },

  // Food
  { keyword: "低卡零食", keywordType: "品类词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 50 },
  { keyword: "配料表", keywordType: "卖点词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 52 },
  { keyword: "饮料测评", keywordType: "品类词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 54 },
  { keyword: "早餐", keywordType: "场景词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 56 },
  { keyword: "复购", keywordType: "卖点词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 58 },
  { keyword: "低卡零食", keywordType: "品类词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 60 },
  { keyword: "饮料测评", keywordType: "品类词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 62 },
  { keyword: "配料表", keywordType: "卖点词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 64 },

  // Fashion
  { keyword: "通勤穿搭", keywordType: "场景词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 70 },
  { keyword: "显瘦", keywordType: "卖点词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 72 },
  { keyword: "版型", keywordType: "痛点词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 74 },
  { keyword: "小个子穿搭", keywordType: "人群词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 76 },
  { keyword: "鞋包搭配", keywordType: "场景词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 78 },
  { keyword: "通勤穿搭", keywordType: "场景词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 80 },
  { keyword: "显瘦", keywordType: "卖点词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 82 },
  { keyword: "版型", keywordType: "痛点词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 84 },

  // Digital
  { keyword: "手机测评", keywordType: "品类词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 90 },
  { keyword: "耳机测评", keywordType: "品类词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 92 },
  { keyword: "续航", keywordType: "卖点词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 94 },
  { keyword: "降噪", keywordType: "卖点词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 96 },
  { keyword: "性价比手机", keywordType: "竞品词", platform: "xiaohongshu", endpoint: "xiaohongshuSearchNotes", priority: 98 },
  { keyword: "手机测评", keywordType: "品类词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 100 },
  { keyword: "耳机测评", keywordType: "品类词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 102 },
  { keyword: "续航", keywordType: "卖点词", platform: "douyin", endpoint: "douyinSearchVideos", priority: 104 },
];

const HOT_KEYWORD_TYPES = new Set(["热点词", "品类词", "竞品词"]);

function recommendedCollectionSettings(
  keywordType: string,
  settings: {
    insightDefaultHotKeywordPerRunLimit: number;
    insightDefaultStandardPerRunLimit: number;
    insightDefaultHotKeywordIntervalHours: number;
    insightDefaultStandardIntervalHours: number;
  },
) {
  const isHot = HOT_KEYWORD_TYPES.has(keywordType);
  return {
    perRunLimit: isHot ? settings.insightDefaultHotKeywordPerRunLimit : settings.insightDefaultStandardPerRunLimit,
    collectIntervalHours: isHot ? settings.insightDefaultHotKeywordIntervalHours : settings.insightDefaultStandardIntervalHours,
  };
}

function isEndpoint(value: string): value is TikHubEndpointKey {
  return value in TIKHUB_ENDPOINTS;
}

function defaultEndpointForPlatform(platform: string): TikHubEndpointKey {
  return platform === "douyin" ? "douyinSearchVideos" : "xiaohongshuSearchNotes";
}

export function endpointFromConfig(value: string): TikHubEndpointKey {
  if (!isEndpoint(value)) {
    throw new Error(`Unsupported TikHub endpoint in keyword config: ${value}`);
  }
  return value;
}

export async function seedDefaultInsightKeywords() {
  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });
  const rows = [];
  for (const item of DEFAULT_KEYWORDS) {
    const platform = item.platform ?? "xiaohongshu";
    const endpoint = item.endpoint ?? defaultEndpointForPlatform(platform);
    const recommended = recommendedCollectionSettings(item.keywordType, settings);
    rows.push(
      await prisma.insightKeywordConfig.upsert({
        where: {
          platform_keyword_keywordType: {
            platform,
            keyword: item.keyword,
            keywordType: item.keywordType,
          },
        },
        update: {
          endpoint,
          active: true,
          priority: item.priority ?? 100,
          perRunLimit: item.perRunLimit ?? recommended.perRunLimit,
          collectIntervalHours: item.collectIntervalHours ?? recommended.collectIntervalHours,
        },
        create: {
          platform,
          endpoint,
          keyword: item.keyword,
          keywordType: item.keywordType,
          active: true,
          priority: item.priority ?? 100,
          perRunLimit: item.perRunLimit ?? recommended.perRunLimit,
          collectIntervalHours: item.collectIntervalHours ?? recommended.collectIntervalHours,
        },
      }),
    );
  }
  return { resultCount: rows.length };
}

export async function getDueInsightKeywordConfigs(limit = 20) {
  const rows = await prisma.insightKeywordConfig.findMany({
    where: { active: true },
    orderBy: [{ priority: "asc" }, { lastCollectedAt: "asc" }, { updatedAt: "asc" }],
    take: 500,
  });
  const now = Date.now();
  const due = [];
  for (const row of rows) {
    const isDue = !row.lastCollectedAt || now - row.lastCollectedAt.getTime() >= row.collectIntervalHours * 60 * 60 * 1000;
    if (isDue) due.push(row);
    if (due.length >= Math.max(1, Math.min(limit, 100))) break;
  }
  return due;
}

export { HOT_KEYWORD_TYPES, recommendedCollectionSettings };
