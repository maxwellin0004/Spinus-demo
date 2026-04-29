export const FUTURE_INCOME_TRACKS_DURATION_IN_FRAMES = 150;

export type FutureIncomeTrack = {
  rank: number;
  title: string;
  thesis: string;
  keywords: string[];
  accent: string;
  softAccent: string;
};

export const futureIncomeTracksHeader = {
  kicker: "2026-2031 趋势观察",
  titleLines: ["未来五年", "值得关注的", "5个高增长赛道"],
  footnote: "信息图仅用于选题与趋势观察，不构成投资建议",
};

export const futureIncomeTracks: FutureIncomeTrack[] = [
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
];
