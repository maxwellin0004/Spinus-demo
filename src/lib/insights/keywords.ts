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
  { keyword: "防晒", keywordType: "品类词", priority: 10 },
  { keyword: "底妆", keywordType: "品类词", priority: 20 },
  { keyword: "敏感肌", keywordType: "人群词", priority: 30 },
  { keyword: "油皮", keywordType: "人群词", priority: 40 },
  { keyword: "持妆", keywordType: "卖点词", priority: 50 },
  { keyword: "搓泥", keywordType: "痛点词", priority: 60 },
  { keyword: "泛白", keywordType: "痛点词", priority: 70 },
  { keyword: "成分安全", keywordType: "卖点词", priority: 80 },
  { keyword: "平价替代", keywordType: "场景词", priority: 90 },
  { keyword: "学生党", keywordType: "人群词", priority: 100 },
];

function isEndpoint(value: string): value is TikHubEndpointKey {
  return value in TIKHUB_ENDPOINTS;
}

export function endpointFromConfig(value: string): TikHubEndpointKey {
  if (!isEndpoint(value)) {
    throw new Error(`Unsupported TikHub endpoint in keyword config: ${value}`);
  }
  return value;
}

export async function seedDefaultInsightKeywords() {
  const rows = [];
  for (const item of DEFAULT_KEYWORDS) {
    rows.push(
      await prisma.insightKeywordConfig.upsert({
        where: {
          platform_keyword_keywordType: {
            platform: item.platform ?? "xiaohongshu",
            keyword: item.keyword,
            keywordType: item.keywordType,
          },
        },
        update: {
          endpoint: item.endpoint ?? "xiaohongshuSearchNotes",
          active: true,
          priority: item.priority ?? 100,
          perRunLimit: item.perRunLimit ?? 5,
          collectIntervalHours: item.collectIntervalHours ?? 24,
        },
        create: {
          platform: item.platform ?? "xiaohongshu",
          endpoint: item.endpoint ?? "xiaohongshuSearchNotes",
          keyword: item.keyword,
          keywordType: item.keywordType,
          active: true,
          priority: item.priority ?? 100,
          perRunLimit: item.perRunLimit ?? 5,
          collectIntervalHours: item.collectIntervalHours ?? 24,
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
    take: Math.max(1, Math.min(limit, 100)),
  });
  const now = Date.now();

  return rows.filter((row) => {
    if (!row.lastCollectedAt) return true;
    const intervalMs = row.collectIntervalHours * 60 * 60 * 1000;
    return now - row.lastCollectedAt.getTime() >= intervalMs;
  });
}
