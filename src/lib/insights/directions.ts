export const DEFAULT_INSIGHT_DIRECTION = "beauty";

export const INSIGHT_DIRECTIONS = [
  {
    slug: "beauty",
    label: "美妆护肤",
    description: "适合护肤、彩妆、防晒、个护和成分测评内容。",
    chips: ["美妆个护", "防晒", "底妆", "敏感肌", "学生党", "更多"],
    brandTrendLabels: ["本品牌被提及", "防晒/底妆讨论", "竞品对比内容", "痛点/卖点反馈"],
    creatorTrendLabels: ["美妆护肤", "彩妆", "成分党", "工具好物"],
    painKeywords: ["搓泥", "泛白", "持妆", "敏感肌", "成分安全", "平价替代"],
  },
  {
    slug: "mother-baby",
    label: "母婴育儿",
    description: "适合奶粉、纸尿裤、儿童用品、玩具、早教和育儿经验内容。",
    chips: ["母婴育儿", "宝宝用品", "安全材质", "适龄阶段", "亲子生活", "更多"],
    brandTrendLabels: ["本品牌被提及", "适龄阶段讨论", "竞品对比内容", "安全顾虑反馈"],
    creatorTrendLabels: ["宝宝用品", "育儿经验", "安全测评", "亲子场景"],
    painKeywords: ["安全性", "适龄", "材质", "过敏", "价格", "实用性"],
  },
  {
    slug: "food",
    label: "食品饮料",
    description: "适合零食、饮料、健康食品、低卡代餐和新品试吃内容。",
    chips: ["食品饮料", "低卡", "口味测评", "配料表", "复购", "更多"],
    brandTrendLabels: ["本品牌被提及", "口味/配料讨论", "竞品对比内容", "复购/价格反馈"],
    creatorTrendLabels: ["口味测评", "配料分析", "新品试吃", "健康低卡"],
    painKeywords: ["太甜", "热量", "配料表", "口感", "性价比", "复购"],
  },
  {
    slug: "fashion",
    label: "服饰穿搭",
    description: "适合穿搭、鞋包、配饰、通勤风格和季节单品内容。",
    chips: ["服饰穿搭", "通勤", "显瘦", "质感", "季节单品", "更多"],
    brandTrendLabels: ["本品牌被提及", "风格场景讨论", "竞品对比内容", "版型/质感反馈"],
    creatorTrendLabels: ["通勤穿搭", "显瘦技巧", "季节单品", "质感测评"],
    painKeywords: ["版型", "显瘦", "面料", "尺码", "色差", "性价比"],
  },
  {
    slug: "digital",
    label: "数码家电",
    description: "适合手机、智能硬件、小家电、家用设备和参数测评内容。",
    chips: ["数码家电", "参数测评", "使用体验", "性价比", "避坑", "更多"],
    brandTrendLabels: ["本品牌被提及", "参数/功能讨论", "竞品对比内容", "体验/售后反馈"],
    creatorTrendLabels: ["参数测评", "使用体验", "横向对比", "避坑指南"],
    painKeywords: ["续航", "噪音", "性能", "售后", "价格", "易用性"],
  },
] as const;

export type InsightDirectionSlug = (typeof INSIGHT_DIRECTIONS)[number]["slug"];

export const INSIGHT_DIRECTION_SLUGS = INSIGHT_DIRECTIONS.map((item) => item.slug) as [InsightDirectionSlug, ...InsightDirectionSlug[]];

export function getInsightDirection(slug?: string | null) {
  return INSIGHT_DIRECTIONS.find((item) => item.slug === slug) ?? INSIGHT_DIRECTIONS[0];
}

export function isInsightDirectionSlug(value: string): value is InsightDirectionSlug {
  return INSIGHT_DIRECTIONS.some((item) => item.slug === value);
}
