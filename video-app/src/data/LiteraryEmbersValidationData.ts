import type { BilingualQuoteCue } from "../components/video/BilingualQuoteTrack";

export type LiteraryEmbersSceneType =
  | "burnHook"
  | "bookCascade"
  | "deskPanel"
  | "streetPanel"
  | "windowPanel"
  | "crossroadPanel"
  | "collapsePanel"
  | "walkawayPanel";

export type LiteraryEmbersScene = {
  id: string;
  type: LiteraryEmbersSceneType;
  duration: number;
  accentText?: string;
  note?: string;
};

export const literaryEmbersMeta = {
  templateId: "literary_embers_quote_montage",
  videoId: "moon_sixpence_validation_v1",
  orientation: "vertical",
  bookTitle: "《月亮与六便士》",
  authorLine: "毛姆 | 著",
  targetTheme: "最可怕的不是离群，而是一直替别人活",
};

export const literaryEmbersCoverFlow = [
  {
    title: "《活着》",
    author: "余华",
    palette: ["#70605b", "#cfbfaf", "#efe2d0"],
    coverImage: "/images/literary-embers/covers/huozhe-douban.png",
  },
  {
    title: "《百年孤独》",
    author: "加西亚·马尔克斯",
    palette: ["#1d7860", "#5fd1a5", "#f5e6b8"],
    coverImage: "/images/literary-embers/covers/one-hundred-years-douban.png",
  },
  {
    title: "《不做告别》",
    author: "韩江",
    palette: ["#f1f5f9", "#d6e4ff", "#8ec5fc"],
    coverImage: "/images/literary-embers/covers/no-goodbye-douban.png",
  },
  {
    title: "《月亮与六便士》",
    author: "毛姆",
    palette: ["#c98531", "#f0b96f", "#2e1d15"],
    coverImage: "/images/literary-embers/covers/moon-sixpence-douban.png",
  },
];

export const literaryEmbersScenes: LiteraryEmbersScene[] = [
  {
    id: "le_s01",
    type: "burnHook",
    duration: 144,
    accentText: "刺痛所有不甘心却一直替别人活的人",
  },
  { id: "le_s02", type: "bookCascade", duration: 94, accentText: "今天分享" },
  {
    id: "le_s03",
    type: "deskPanel",
    duration: 124,
    accentText: "不是没想过",
    note: "office life and stacked books",
  },
  {
    id: "le_s04",
    type: "streetPanel",
    duration: 156,
    accentText: "而是不敢偏离",
    note: "street window and walking figure",
  },
  {
    id: "le_s05",
    type: "windowPanel",
    duration: 128,
    accentText: "沉默地向内坍塌",
    note: "ledge and city view",
  },
  {
    id: "le_s06",
    type: "crossroadPanel",
    duration: 156,
    accentText: "把决定还给自己",
    note: "crossroad and shadow",
  },
  {
    id: "le_s07",
    type: "collapsePanel",
    duration: 173,
    accentText: "听见内心却一次次按回去",
    note: "room corner and crouched figure",
  },
  {
    id: "le_s08",
    type: "walkawayPanel",
    duration: 129,
    accentText: "如果总怕失去掌声",
    note: "bright road and back view",
  },
];

export const LITERARY_EMBERS_DURATION_IN_FRAMES = literaryEmbersScenes.reduce(
  (sum, scene) => sum + scene.duration,
  0,
);

export const literaryEmbersEstimatedSubtitleCues: BilingualQuoteCue[] = [
  {
    voiceId: "le_v01",
    startFrame: 0,
    endFrame: 139,
    textZh: "这句话会刺痛所有\n不甘心却一直替别人活的人",
    textEn: "This line hits everyone\nwho keeps living for other eyes.",
    emphasisWords: ["替别人活"],
  },
  {
    voiceId: "le_v02",
    startFrame: 144,
    endFrame: 233,
    textZh: "今天分享《月亮与六便士》",
    textEn: "Today: The Moon and Sixpence.",
    emphasisWords: ["《月亮与六便士》"],
  },
  {
    voiceId: "le_v03",
    startFrame: 238,
    endFrame: 360,
    textZh: "很多人不是没有天赋，\n只是从来没替自己活过",
    textEn: "Many people lack not talent,\nbut the courage to live for themselves.",
    emphasisWords: ["替自己活过"],
  },
  {
    voiceId: "le_v04",
    startFrame: 362,
    endFrame: 516,
    textZh: "你抱怨生活沉闷，\n却把每次选择都交给体面和目光",
    textEn: "You resent a dull life,\nyet hand every choice to approval and safety.",
    emphasisWords: ["体面", "目光"],
  },
  {
    voiceId: "le_v05",
    startFrame: 518,
    endFrame: 641,
    textZh: "于是工作是为了交代，\n努力是为了比较",
    textEn: "Work becomes explanation,\nand effort becomes comparison.",
    emphasisWords: ["交代", "比较"],
  },
  {
    voiceId: "le_v06",
    startFrame: 646,
    endFrame: 799,
    textZh: "真正困住人的不是起点，\n而是听见内心后又把它按回去",
    textEn: "What traps you is not the start,\nbut silencing what you already heard inside.",
    emphasisWords: ["按回去"],
  },
  {
    voiceId: "le_v07",
    startFrame: 802,
    endFrame: 972,
    textZh: "不是每个人都要离开现实，\n但每个人都该有一次为自己负责的决定",
    textEn: "Not everyone must flee reality,\nbut everyone deserves one decision owned by the self.",
    emphasisWords: ["为自己负责"],
  },
  {
    voiceId: "le_v08",
    startFrame: 975,
    endFrame: 1104,
    textZh: "如果你总怕失去掌声，\n最后失去的往往就是自己",
    textEn: "If you fear losing applause,\nyou may end up losing yourself.",
    emphasisWords: ["自己"],
  },
];
