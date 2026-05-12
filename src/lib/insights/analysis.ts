import type { InsightComment, InsightContent, InsightTopic } from "@prisma/client";

export type CommentSentiment = "正面" | "中性" | "负面";

const POSITIVE_TERMS = ["好用", "喜欢", "推荐", "有效", "提升", "舒服", "稳定", "持妆", "显白", "惊艳", "值得", "满意", "回购"];
const NEGATIVE_TERMS = ["搓泥", "卡粉", "浮粉", "泛白", "脱妆", "闷痘", "刺激", "踩雷", "翻车", "鸡肋", "失望", "起皮", "厚重", "拔干"];

const PAIN_POINT_RULES = [
  { label: "搓泥", terms: ["搓泥", "起屑", "结块", "卡粉", "起皮"] },
  { label: "泛白", terms: ["泛白", "假白", "死白", "发灰"] },
  { label: "持妆", terms: ["脱妆", "持妆", "出油", "暗沉", "斑驳"] },
  { label: "成分安全", terms: ["敏感", "刺激", "成分", "酒精", "香精", "致痘"] },
  { label: "性价比", terms: ["贵", "平替", "性价比", "价格", "划算"] },
  { label: "使用体验", terms: ["厚重", "油腻", "清爽", "吸收", "肤感"] },
];

const RISK_RULES = [
  { label: "夸大宣传", terms: ["100%", "绝对", "立刻", "秒", "神效", "包治", "最有效", "永久"] },
  { label: "功效争议", terms: ["刷酸", "美白", "修复", "祛痘", "防晒", "美白效果"] },
  { label: "成分争议", terms: ["敏感", "过敏", "酒精", "香精", "激素", "防腐"] },
  { label: "价格争议", terms: ["太贵", "溢价", "不值", "割韭菜", "智商税"] },
  { label: "场景风险", terms: ["夏天", "通勤", "运动", "暴晒", "熬夜"] },
];

function countTerms(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((sum, term) => sum + (lower.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function scoreSentiment(text: string): CommentSentiment {
  const positive = countTerms(text, POSITIVE_TERMS);
  const negative = countTerms(text, NEGATIVE_TERMS);
  if (negative - positive >= 1) return "负面";
  if (positive - negative >= 1) return "正面";
  return "中性";
}

function firstMatch(text: string, rules: { label: string; terms: string[] }[]) {
  let winner: { label: string; score: number } | null = null;
  for (const rule of rules) {
    const score = countTerms(text, rule.terms);
    if (score <= 0) continue;
    if (!winner || score > winner.score) winner = { label: rule.label, score };
  }
  return winner?.label;
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
  title: string;
  platform: string;
  creator: string;
  reason: string;
  tags: string[];
  heat: string;
  tone: string;
};

export function summarizeCommentSignals(comments: InsightComment[]) {
  const enriched = enrichComments(comments);
  const totals = { positive: 0, neutral: 0, negative: 0 };
  const painMap = new Map<string, { mentions: number; negative: number; sample: string }>();
  const riskMap = new Map<string, { mentions: number; sample: string }>();

  for (const comment of enriched) {
    totals[comment.sentiment === "正面" ? "positive" : comment.sentiment === "负面" ? "negative" : "neutral"] += 1;

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
    .sort(([, a], [, b]) => b.mentions - a.mentions)
    .slice(0, 6)
    .map(([keyword, item]) => ({
      keyword,
      mentions: item.mentions,
      sentiment: item.negative / item.mentions >= 0.4 ? "负面" : item.negative > 0 ? "中性" : "正面",
      sample: item.sample,
    }));

  const risks: RiskSummary[] = Array.from(riskMap.entries())
    .sort(([, a], [, b]) => b.mentions - a.mentions)
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

export function deriveContentRecommendations(contents: InsightContent[], commentCountByContentId: Map<string, number>) {
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

    return {
      title: content.title,
      platform: content.platform,
      creator: content.authorName ?? "未知作者",
      reason: `${content.keyword ?? "内容样本"} 已有 ${comments} 条评论和 ${engagement.toLocaleString()} 次互动，可继续做同题材扩展。`,
      tags: [content.keyword ?? "内容样本", content.platform, content.authorName ? "达人样本" : "内容样本"],
      heat: `${heat}分`,
      tone,
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
