import { z } from "zod";

export const FUTURE_INCOME_TRACKS_DURATION_IN_FRAMES = 150;

export const futureIncomeTrackSchema = z.object({
  rank: z.number().int().min(1).max(99),
  title: z.string().min(1),
  thesis: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(3).max(6),
  accent: z.string().min(1),
  softAccent: z.string().min(1),
});

export const futureIncomeTracksTemplateSchema = z.object({
  header: z.object({
    kicker: z.string().min(1),
    titleLines: z.array(z.string().min(1)).min(2).max(4),
    footerLead: z.string().min(1),
    footnote: z.string().min(1),
  }),
  tracks: z.array(futureIncomeTrackSchema).length(5),
  visual: z.object({
    background: z.string().min(1),
    titleColor: z.string().min(1),
    titleShadow: z.string().min(1),
    kickerBackground: z.string().min(1),
    kickerColor: z.string().min(1),
    footerColor: z.string().min(1),
    cardTextColor: z.string().min(1),
    gridOpacity: z.number().min(0).max(1),
  }),
});

export type FutureIncomeTrack = z.infer<typeof futureIncomeTrackSchema>;
export type FutureIncomeTracksTemplateProps = z.infer<
  typeof futureIncomeTracksTemplateSchema
>;

export const defaultFutureIncomeTracksProps = {
  header: {
    kicker: "2026-2031 趋势观察",
    titleLines: ["未来五年", "值得关注的", "5个高增长赛道"],
    footerLead: "收藏前先判断：需求频次 / 客单价 / 复购 / 交付难度",
    footnote: "信息图仅用于选题与趋势观察，不构成投资建议",
  },
  tracks: [
    {
      rank: 5,
      title: "银发经济",
      thesis: "从照护转向长期服务，需求更稳定。",
      keywords: ["康养陪护", "适老化改造", "智能看护", "老年教育", "辅具用品"],
      accent: "#8ef6c2",
      softAccent: "rgba(142, 246, 194, 0.76)",
    },
    {
      rank: 4,
      title: "新农经济",
      thesis: "好产品、好渠道、好故事重新连接消费。",
      keywords: ["原生态食品", "本地品牌", "乡村文旅", "线上认养", "生鲜供应链"],
      accent: "#f5fb7c",
      softAccent: "rgba(245, 251, 124, 0.84)",
    },
    {
      rank: 3,
      title: "疗愈经济",
      thesis: "健康管理与情绪价值开始合流。",
      keywords: ["睡眠管理", "心理咨询", "身心课程", "轻康复", "情绪陪伴"],
      accent: "#74e5d4",
      softAccent: "rgba(116, 229, 212, 0.72)",
    },
    {
      rank: 2,
      title: "悦己经济",
      thesis: "为审美、体验和身份感买单。",
      keywords: ["护肤美妆", "香氛穿搭", "健身塑形", "兴趣社群", "精致单人消费"],
      accent: "#fff38a",
      softAccent: "rgba(255, 243, 138, 0.86)",
    },
    {
      rank: 1,
      title: "健康领域",
      thesis: "从治病转向预防、监测和日常管理。",
      keywords: ["营养管理", "运动康复", "居家检测", "低糖低脂", "家庭健康服务"],
      accent: "#72f2a2",
      softAccent: "rgba(114, 242, 162, 0.78)",
    },
  ],
  visual: {
    background:
      "radial-gradient(circle at 50% 7%, rgba(189, 255, 120, 0.75), transparent 23%), radial-gradient(circle at 18% 78%, rgba(35, 226, 156, 0.42), transparent 25%), linear-gradient(180deg, #0a2a1c 0%, #5ee994 43%, #c9ff79 100%)",
    titleColor: "#06110b",
    titleShadow:
      "0 4px 0 rgba(208, 255, 95, 0.45), 0 18px 36px rgba(0,0,0,0.2)",
    kickerBackground: "rgba(8, 25, 17, 0.82)",
    kickerColor: "#dfff86",
    footerColor: "#07130e",
    cardTextColor: "#06110c",
    gridOpacity: 0.08,
  },
} satisfies FutureIncomeTracksTemplateProps;

export const futureIncomeTracksHeader = defaultFutureIncomeTracksProps.header;
export const futureIncomeTracks = defaultFutureIncomeTracksProps.tracks;
