export type PhilosophySceneType =
  | "openerConcepts"
  | "titleStack"
  | "conceptBoard"
  | "ruminationExample"
  | "controlSplit"
  | "decisionPrompt"
  | "axiomWall"
  | "cityOutro";

export type PhilosophyMontageScene = {
  id: string;
  type: PhilosophySceneType;
  duration: number;
  subtitleLines: string[];
  image: string;
  palette: [string, string, string];
};

export type PhilosophyMontageOpenerConfig = {
  introTitle: string;
  terms: string[];
  bgImages: string[];
  introFrames?: number;
  switchEvery?: number;
};

export const PHILOSOPHY_MONTAGE_FPS = 30;

export const philosophyMontageScenes: PhilosophyMontageScene[] = [
  {
    id: "s00",
    type: "openerConcepts",
    duration: 210,
    subtitleLines: ["今天我们要讲的是", "数字极简主义。"],
    image: "/images/philosophy-montage/dramatic_sky_b.jpg",
    palette: ["#0a2240", "#0f4c81", "#6ee7ff"],
  },
  {
    id: "s01",
    type: "titleStack",
    duration: 210,
    subtitleLines: ["你不是没时间，", "你是被噪音偷走了注意力。"],
    image: "/images/philosophy-montage/focus_feed_trap.png",
    palette: ["#0f172a", "#1e3a8a", "#0ea5e9"],
  },
  {
    id: "s02",
    type: "conceptBoard",
    duration: 225,
    subtitleLines: ["刷到很多，", "不等于思考很多。"],
    image: "/images/philosophy-montage/screen_overload_wall.png",
    palette: ["#0f172a", "#334155", "#60a5fa"],
  },
  {
    id: "s03",
    type: "ruminationExample",
    duration: 270,
    subtitleLines: ["通知每响一次，", "你的大脑就要重启一次。", "这不是放松，是切换成本。"],
    image: "/images/philosophy-montage/notification_burst_desk.png",
    palette: ["#1e1b4b", "#1f2937", "#f59e0b"],
  },
  {
    id: "s04",
    type: "controlSplit",
    duration: 285,
    subtitleLines: ["可控：打开频次、停留时长、提醒开关。", "不可控：推荐机制、热点节奏。"],
    image: "/images/philosophy-montage/control_vs_chaos.png",
    palette: ["#0f172a", "#0c4a6e", "#22d3ee"],
  },
  {
    id: "s05",
    type: "decisionPrompt",
    duration: 225,
    subtitleLines: ["先问一句：我现在打开它是为了什么？", "目的不清，就先别打开。"],
    image: "/images/philosophy-montage/pause_before_unlock.png",
    palette: ["#0f172a", "#4c1d95", "#f472b6"],
  },
  {
    id: "s06",
    type: "axiomWall",
    duration: 270,
    subtitleLines: ["每天给高价值信息 90 分钟预算。", "娱乐延后，不是禁止。"],
    image: "/images/philosophy-montage/focus_budget_workspace.png",
    palette: ["#052e16", "#14532d", "#86efac"],
  },
  {
    id: "s07",
    type: "cityOutro",
    duration: 210,
    subtitleLines: ["当你掌控入口，", "焦虑先下降，效率才会上升。"],
    image: "/images/philosophy-montage/morning_control_city.png",
    palette: ["#0f172a", "#334155", "#c084fc"],
  },
];

export const PHILOSOPHY_MONTAGE_DURATION = philosophyMontageScenes.reduce(
  (sum, scene) => sum + scene.duration,
  0
);

export const philosophyMontageOpenerConfig: PhilosophyMontageOpenerConfig = {
  introTitle: "今天我们要讲的是",
  terms: [
    "享乐主义",
    "消费主义",
    "虚无主义",
    "完美主义",
    "犬儒主义",
    "工具理性",
    "功利主义",
    "存在主义",
    "斯多葛主义",
    "数字极简主义",
  ],
  bgImages: [
    "/images/philosophy-montage/opener-style/opener_01.jpg",
    "/images/philosophy-montage/opener-style/opener_02.jpg",
    "/images/philosophy-montage/opener-style/opener_03.jpg",
    "/images/philosophy-montage/opener-style/opener_04.jpg",
    "/images/philosophy-montage/opener-style/opener_05.jpg",
    "/images/philosophy-montage/opener-style/opener_06.jpg",
    "/images/philosophy-montage/opener-style/opener_07.jpg",
    "/images/philosophy-montage/opener-style/opener_08.jpg",
    "/images/philosophy-montage/opener-style/opener_09.jpg",
    "/images/philosophy-montage/opener-style/opener_10.jpg",
  ],
  introFrames: 24,
  switchEvery: 9,
};
