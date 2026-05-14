import type { InsightComment, InsightContent, InsightTopic } from "@prisma/client";
import { extractCoverImageUrl } from "@/lib/tikhub/mappers";

export type CommentSentiment = "正面" | "中性" | "负面";

const POSITIVE_TERMS = ["好用", "喜欢", "推荐", "有效", "提升", "舒服", "稳定", "持妆", "显白", "惊艳", "值得", "满意", "回购"];
const NEGATIVE_TERMS = ["搓泥", "卡粉", "浮粉", "泛白", "脱妆", "闷痘", "刺激", "踩雷", "翻车", "鸡肋", "失望", "起皮", "厚重", "拔干"];

const PAIN_POINT_RULES = [
  { label: "卡粉", terms: ["卡粉", "起皮", "搓泥", "结块", "不服帖"] },
  { label: "泛白", terms: ["泛白", "假白", "发灰", "死白"] },
  { label: "持妆", terms: ["脱妆", "暗沉", "出油", "斑驳", "不持久"] },
  { label: "成分安全", terms: ["敏感", "刺激", "成分", "酒精", "香精", "致痘"] },
  { label: "尺码版型", terms: ["版型", "尺码", "显瘦", "合身", "肩宽", "腰线", "裤长", "长度"] },
  { label: "面料质感", terms: ["面料", "质感", "起球", "掉色", "透", "皱", "闷", "扎", "做工"] },
  { label: "口味口感", terms: ["口味", "口感", "太甜", "太咸", "腻", "苦", "难喝", "回味"] },
  { label: "配料热量", terms: ["配料", "添加剂", "热量", "糖分", "脂肪", "卡路里", "钠"] },
  { label: "续航性能", terms: ["续航", "发热", "卡顿", "延迟", "掉帧", "噪音"] },
  { label: "售后耐用", terms: ["售后", "保修", "返修", "故障", "耐用", "掉漆"] },
  { label: "性价比", terms: ["贵", "平替", "性价比", "价格", "划算"] },
  { label: "使用体验", terms: ["厚重", "油腻", "清爽", "吸收", "肤感"] },
] as const;

const RISK_RULES = [
  { label: "夸大宣传", terms: ["100%", "绝对", "立刻", "秒", "神效", "永久"] },
  { label: "功效争议", terms: ["美白", "修复", "祛痘", "防晒", "刷酸"] },
  { label: "成分争议", terms: ["敏感", "过敏", "酒精", "香精", "激素", "防腐"] },
  { label: "价格争议", terms: ["太贵", "溢价", "不值", "智商税"] },
  { label: "场景风险", terms: ["夏天", "通勤", "运动", "暴晒", "熬夜"] },
] as const;

function countTerms(text: string, terms: readonly string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((sum, term) => sum + (lower.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function scoreSentiment(text: string): CommentSentiment {
  const positive = countTerms(text, POSITIVE_TERMS);
  const negative = countTerms(text, NEGATIVE_TERMS);
  if (negative > positive) return "负面";
  if (positive > negative) return "正面";
  return "中性";
}

function firstMatch(text: string, rules: readonly { label: string; terms: readonly string[] }[]) {
  let winner: { label: string; score: number } | null = null;
  for (const rule of rules) {
    const score = countTerms(text, rule.terms);
    if (score <= 0) continue;
    if (!winner || score > winner.score) winner = { label: rule.label, score };
  }
  return winner?.label ?? null;
}

export function analyzeCommentText(text: string) {
  const sentiment = scoreSentiment(text);
  const painPoint = firstMatch(text, PAIN_POINT_RULES);
  const riskTag = firstMatch(text, RISK_RULES);
  return { sentiment, painPoint, riskTag };
}

export function enrichComments<T extends { text: string }>(comments: T[]) {
  return comments.map((comment) => ({
    ...comment,
    ...analyzeCommentText(comment.text),
  }));
}

export type PainPointSummary = {
  keyword: string;
  mentions: number;
  sentiment: CommentSentiment;
  sample: string;
};

export type RiskSummary = {
  title: string;
  detail: string;
  level: "高" | "中" | "低";
};

export type RecommendationSummary = {
  id: string;
  title: string;
  platform: string;
  creator: string;
  keyword: string;
  sampleTitle: string;
  sampleContentUrl?: string;
  sampleSourceContentId: string;
  reason: string;
  tags: string[];
  heat: string;
  tone: string;
  metrics: {
    likes: number;
    comments: number;
    collects: number;
    shares: number;
  };
  angles: string[];
  coverImageUrl?: string;
};

export function summarizeCommentSignals(comments: InsightComment[]) {
  const enriched = enrichComments(comments);
  const totals = { positive: 0, neutral: 0, negative: 0 };
  const painMap = new Map<string, { mentions: number; negative: number; sample: string }>();
  const riskMap = new Map<string, { mentions: number; sample: string }>();

  for (const comment of enriched) {
    const bucket = comment.sentiment === "正面" ? "positive" : comment.sentiment === "负面" ? "negative" : "neutral";
    totals[bucket] += 1;

    if (comment.painPoint) {
      const current = painMap.get(comment.painPoint) ?? { mentions: 0, negative: 0, sample: comment.text };
      current.mentions += 1;
      current.negative += comment.sentiment === "负面" ? 1 : 0;
      current.sample = current.sample || comment.text;
      painMap.set(comment.painPoint, current);
    }

    if (comment.riskTag) {
      const current = riskMap.get(comment.riskTag) ?? { mentions: 0, sample: comment.text };
      current.mentions += 1;
      current.sample = current.sample || comment.text;
      riskMap.set(comment.riskTag, current);
    }
  }

  const painPoints: PainPointSummary[] = Array.from(painMap.entries())
    .sort(([, left], [, right]) => right.mentions - left.mentions)
    .slice(0, 6)
    .map(([keyword, item]) => ({
      keyword,
      mentions: item.mentions,
      sentiment: item.negative / item.mentions >= 0.4 ? "负面" : item.negative > 0 ? "中性" : "正面",
      sample: item.sample,
    }));

  const risks: RiskSummary[] = Array.from(riskMap.entries())
    .sort(([, left], [, right]) => right.mentions - left.mentions)
    .slice(0, 4)
    .map(([title, item]) => ({
      title,
      detail: item.sample,
      level: item.mentions >= 4 ? "高" : item.mentions >= 2 ? "中" : "低",
    }));

  const totalComments = totals.positive + totals.negative + totals.neutral;
  return {
    totals,
    comments: enriched,
    painPoints,
    risks,
    positiveRate: totalComments > 0 ? totals.positive / totalComments : 0,
  };
}

function sanitizeSeed(value: string) {
  return value
    .replace(/[#@]/g, " ")
    .replace(/[!！?？,，。、“”"'`~·/\\|()[\]{}<>《》]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function topicSeed(content: InsightContent) {
  const keyword = sanitizeSeed(content.keyword ?? "");
  if (keyword) return keyword;

  const title = sanitizeSeed(content.title);
  if (!title) return "这个话题";

  if (title.length <= 12) return title;

  const chunks = title
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((chunk) => chunk.split(/[:：-]/))
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.find((chunk) => chunk.length >= 2 && chunk.length <= 10) ?? title.slice(0, 10);
}

function detectContentPattern(content: InsightContent) {
  const text = `${content.title} ${content.keyword ?? ""}`;
  if (/教程|步骤|手把手|教学|怎么|如何/.test(text)) return "tutorial";
  if (/测评|评测|实测|对比|空瓶|回购/.test(text)) return "review";
  if (/避雷|踩雷|翻车|千万别|雷品/.test(text)) return "warning";
  if (/平替|替代|同款/.test(text)) return "alternative";
  return "general";
}

function dominantPainPoint(commentTexts: string[]) {
  const scoreByLabel = new Map<string, number>();
  for (const text of commentTexts) {
    const match = firstMatch(text, PAIN_POINT_RULES);
    if (!match) continue;
    scoreByLabel.set(match, (scoreByLabel.get(match) ?? 0) + 1);
  }

  return Array.from(scoreByLabel.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function recommendationAngles(content: InsightContent, commentTexts: string[]) {
  const seed = topicSeed(content);
  const painPoint = dominantPainPoint(commentTexts);
  const pattern = detectContentPattern(content);

  const titles =
    painPoint && pattern === "tutorial"
      ? [
          `新手做${seed}，最容易卡在这一步`,
          `${seed}${painPoint}一直反复，多半不是产品的问题`,
          `${seed}想做干净，先把${painPoint}这件事解决`,
        ]
      : painPoint && pattern === "review"
        ? [
            `${seed}${painPoint}到底是手法问题还是产品问题`,
            `${seed}实测后，最容易被忽略的是${painPoint}`,
            `同样做${seed}，为什么别人不容易${painPoint}`,
          ]
        : painPoint && pattern === "warning"
          ? [
              `${seed}最容易翻车的，不是产品而是${painPoint}`,
              `做${seed}一旦出现${painPoint}，先别急着换全套`,
              `${seed}${painPoint}反复出现，问题通常不在价格`,
            ]
          : painPoint && pattern === "alternative"
            ? [
                `${seed}想找平替，先别忽略${painPoint}`,
                `${seed}${painPoint}没解决，再便宜也很难好看`,
                `${seed}做平替内容，最容易引发讨论的是${painPoint}`,
              ]
            : painPoint
              ? [
                  `${seed}${painPoint}到底该先改手法还是先换产品`,
                  `新手做${seed}，最容易踩中的就是${painPoint}`,
                  `${seed}为什么总是被说${painPoint}`,
                ]
              : pattern === "tutorial"
                ? [
                    `新手做${seed}，先改这一步就够了`,
                    `${seed}为什么总是做不干净`,
                    `${seed}想做得更稳，先别急着堆产品`,
                  ]
                : pattern === "review"
                  ? [
                      `${seed}值不值得跟风，先看这3个结果`,
                      `${seed}实测后，差距最大的不是价格`,
                      `${seed}为什么同样做法，效果差这么多`,
                    ]
                  : pattern === "warning"
                    ? [
                        `${seed}最容易翻车的，其实不是选错产品`,
                        `${seed}一旦出现问题，先别急着怪肤质`,
                        `${seed}最常见的踩雷点，很多人都忽略了`,
                      ]
                    : pattern === "alternative"
                      ? [
                          `${seed}想找平替，先别只看价格`,
                          `${seed}平替内容为什么总是容易翻车`,
                          `${seed}做平替对比，最该先讲哪一步`,
                        ]
                      : [
                          `${seed}为什么总是做不好`,
                          `新手做${seed}最容易踩的3个坑`,
                          `${seed}到底该先改手法还是先换产品`,
                        ];

  return Array.from(new Set(titles));
}

function recommendationReason(keyword: string, comments: number, engagement: number, painPoint: string | null) {
  const focus = painPoint ? `讨论集中在“${painPoint}”这个具体痛点` : "讨论集中在新手上手和实际效果";
  return `${keyword}已有 ${comments} 条评论和 ${engagement.toLocaleString()} 次互动，${focus}，适合继续往问题拆解和可执行建议延展。`;
}

export function deriveContentRecommendations(
  contents: InsightContent[],
  commentCountByContentId: Map<string, number>,
  commentTextsByContentId: Map<string, string[]> = new Map(),
) {
  return contents.slice(0, 4).map((content, index) => {
    const comments = commentCountByContentId.get(content.id) ?? 0;
    const engagement = content.likeCount + content.commentCount + content.shareCount + content.collectCount;
    const heat = Math.min(100, Math.round(content.heatScore));
    const tone =
      index % 4 === 0
        ? "from-teal-100 to-emerald-50"
        : index % 4 === 1
          ? "from-blue-100 to-sky-50"
          : index % 4 === 2
            ? "from-orange-100 to-amber-50"
            : "from-rose-100 to-pink-50";
    const keyword = topicSeed(content);
    const commentTexts = commentTextsByContentId.get(content.id) ?? [];
    const painPoint = dominantPainPoint(commentTexts);
    const angles = recommendationAngles(content, commentTexts);

    return {
      id: content.id,
      title: angles[index % angles.length] ?? `${keyword}为什么总是做不好`,
      platform: content.platform,
      creator: content.authorName ?? "未知作者",
      keyword,
      sampleTitle: content.title,
      sampleContentUrl: content.contentUrl ?? undefined,
      sampleSourceContentId: content.sourceContentId,
      reason: recommendationReason(keyword, comments, engagement, painPoint),
      tags: [keyword, content.platform, content.authorName ? "达人样本" : "内容样本"],
      heat: `${heat}分`,
      tone,
      metrics: {
        likes: content.likeCount,
        comments: content.commentCount,
        collects: content.collectCount,
        shares: content.shareCount,
      },
      angles,
      coverImageUrl: extractCoverImageUrl(content.rawPayload),
    };
  });
}

export function deriveTopicAdvice(topic: InsightTopic) {
  const heat = Math.round(topic.heatScore);
  const competition = heat >= 80 ? "高" : heat >= 50 ? "中" : "低";
  const difficulty = heat >= 80 ? "高" : heat >= 50 ? "中" : "低";
  const advice = heat >= 70 ? "立即跟" : heat >= 45 ? "可长尾" : "谨慎跟";
  return {
    match: `${Math.min(98, Math.max(70, heat))}%`,
    competition,
    difficulty,
    advice,
  };
}
