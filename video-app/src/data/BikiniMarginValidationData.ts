import type { AudioLayerConfig, SubtitleCue } from "../lib/audioTypes";

export const bikiniMarginSubtitleCues: SubtitleCue[] = [
  {
    startFrame: 0,
    endFrame: 154,
    text: "\u6d77\u7ef5\u5b9d\u5b9d\u4e0d\u662f\u6ca1\u65f6\u95f4\uff0c\u662f\u628a\u65f6\u95f4\u5168\u82b1\u5728\u8ffd\u6c34\u6bcd\u70ed\u95f9\u4e0a\u3002",
    emphasisWords: []
  },
  {
    startFrame: 154,
    endFrame: 328,
    text: "\u87f9\u8001\u677f\u5148\u8ba9\u6d77\u7ef5\u5b9d\u5b9d\u8bb0\u4e00\u5f20\u65f6\u95f4\u8d26\u672c\uff0c\u628a\u6bcf\u5929\u6295\u5165\u7b97\u6e05\u695a\u3002",
    emphasisWords: []
  },
  {
    startFrame: 328,
    endFrame: 459,
    text: "\u6bd4\u5982\u4e0b\u73ed\u540e\u5237\u4e00\u5c0f\u65f6\u6d77\u5e95\u516b\u5366\u77ed\u7247\uff0c\u5f53\u4e0b\u5f88\u723d\u3002",
    emphasisWords: []
  },
  {
    startFrame: 459,
    endFrame: 586,
    text: "\u4f46\u4e00\u5468\u5c31\u662f\u4e03\u5c0f\u65f6\uff0c\u4e00\u5e74\u5c31\u80fd\u6d88\u8017\u4e09\u767e\u591a\u5c0f\u65f6\u3002",
    emphasisWords: []
  },
  {
    startFrame: 586,
    endFrame: 706,
    text: "\u95ee\u9898\u4e0d\u662f\u653e\u677e\uff0c\u800c\u662f\u6ca1\u7ed9\u5a31\u4e50\u8bbe\u9884\u7b97\u4e0a\u9650\u3002",
    emphasisWords: []
  },
  {
    startFrame: 706,
    endFrame: 822,
    text: "\u63a5\u7740\uff0c\u6d77\u7ef5\u5b9d\u5b9d\u8111\u5b50\u91cc\u4f1a\u8df3\u51fa\u4e09\u79cd\u58f0\u97f3\u3002",
    emphasisWords: []
  },
  {
    startFrame: 822,
    endFrame: 1014,
    text: "\u6d3e\u5927\u661f\u558a\u5148\u723d\u518d\u8bf4\uff0c\u7ae0\u9c7c\u54e5\u8bf4\u5148\u6295\u518d\u6da8\uff0c\u6d77\u7ef5\u5b9d\u5b9d\u5de6\u53f3\u6447\u6446\u3002",
    emphasisWords: []
  },
  {
    startFrame: 1014,
    endFrame: 1122,
    text: "\u771f\u6b63\u6709\u6548\u7684\u505a\u6cd5\uff0c\u662f\u628a\u9ad8\u56de\u62a5\u52a8\u4f5c\u6392\u5728\u7b2c\u4e00\u4f4d\u3002",
    emphasisWords: []
  },
  {
    startFrame: 1122,
    endFrame: 1217,
    text: "\u53ef\u6267\u884c\u7248\u672c\uff1a\u6bcf\u5929\u5148\u62ff\u56de\u4e09\u5341\u5206\u949f\u3002",
    emphasisWords: []
  },
  {
    startFrame: 1217,
    endFrame: 1369,
    text: "\u524d\u5341\u4e94\u5206\u949f\u5b66\u914d\u65b9\u3001\u82f1\u8bed\u6216\u526a\u8f91\uff0c\u540e\u5341\u4e94\u5206\u949f\u590d\u76d8\u7b14\u8bb0\u3002",
    emphasisWords: []
  },
  {
    startFrame: 1369,
    endFrame: 1462,
    text: "\u8fd9\u6837\u6bcf\u5468\u90fd\u80fd\u56de\u6536\u4e00\u6bb5\u53ef\u590d\u5229\u7684\u65f6\u95f4\u3002",
    emphasisWords: []
  },
  {
    startFrame: 1462,
    endFrame: 1594,
    text: "\u5230\u4e86\u591c\u91cc\uff0c\u7ed3\u679c\u4f1a\u50cf\u7ae0\u9c7c\u54e5\u7684\u8868\u60c5\u4e00\u6837\u8bda\u5b9e\u3002",
    emphasisWords: []
  },
  {
    startFrame: 1594,
    endFrame: 1714,
    text: "\u4f60\u8f93\u7684\u4e0d\u662f\u5fd9\uff0c\u662f\u628a\u65f6\u95f4\u6295\u7ed9\u4e86\u4f4e\u56de\u62a5\u9009\u9879\u3002",
    emphasisWords: []
  },
  {
    startFrame: 1714,
    endFrame: 1843,
    text: "\u4ece\u4eca\u5929\u8d77\uff0c\u8ba9\u6d77\u7ef5\u5b9d\u5b9d\u5f0f\u52aa\u529b\uff0c\u6bcf\u6b21\u90fd\u66f4\u503c\u94b1\u3002",
    emphasisWords: []
  },
];

export const bikiniMarginAudioConfig: AudioLayerConfig = {
  voiceover: {
    src: "/audio/bikini-margin/budget-theater-elevenlabs-cn.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  bgm: null,
  sfx: [],
  duckingRules: [{ target: "bgm", when: "voice_active", gain: 0.45 }],
  subtitles: bikiniMarginSubtitleCues,
};

export const bikiniMarginValidationData = {
  videoId: "budget_theater_validation_v2",
  hook: {
    headlineLines: [
      "\u6d77\u7ef5\u5b9d\u5b9d\u4e0d\u662f\u6ca1\u65f6\u95f4",
      "\u800c\u662f\u628a\u65f6\u95f4",
      "\u82b1\u5728\u8ffd\u6c34\u6bcd\u70ed\u95f9\u4e0a"
    ],
    subline: "\u6bd4\u5947\u5821\u7684 24 \u5c0f\u65f6\uff0c\u4e5f\u9700\u8981\u9884\u7b97\u3002"
  },
  equation: {
    title: "\u6bd4\u5947\u5821\u65f6\u95f4\u6807\u4ef7",
    metrics: [
      { label: "\u5237\u6d77\u5e95\u516b\u5366", value: "1h/day", note: "\u5f53\u4e0b\u5f88\u723d" },
      { label: "\u5468\u635f\u8017", value: "7h", note: "\u88ab\u70ed\u95f9\u5403\u6389" },
      { label: "\u5e74\u635f\u8017", value: "364h", note: "\u8db3\u591f\u5b66\u4e00\u95e8\u6280\u80fd" },
    ],
  },
  debate: {
    title: "\u6d77\u7ef5\u5b9d\u5b9d\u7684\u4e09\u65b9\u62c9\u626f",
    bubbles: ["\u5148\u723d\u518d\u8bf4", "\u5148\u6295\u518d\u6da8", "\u4f60\u9009\u54ea\u8fb9\uff1f"],
    actors: [
      { id: "a1", label: "\u6d3e\u5927\u661f", color: "#ff8a8a", anchor: "left" as const },
      { id: "a2", label: "\u6d77\u7ef5\u5b9d\u5b9d", color: "#ffe066", anchor: "center" as const },
      { id: "a3", label: "\u7ae0\u9c7c\u54e5", color: "#7dd3fc", anchor: "right" as const },
    ],
  },
  choices: {
    title: "30\u5206\u949f\u6bd4\u5947\u5821\u66ff\u6362\u6cd5",
    cards: [
      { title: "\u5148\u5b66", body: "15\u5206\u949f\u5b66\u914d\u65b9\u3001\u82f1\u8bed\u6216\u526a\u8f91" },
      { title: "\u518d\u590d\u76d8", body: "15\u5206\u949f\u8bb0\u5f55\u4eca\u5929\u7684\u53ef\u6267\u884c\u52a8\u4f5c" },
      { title: "\u5f00\u59cb\u590d\u5229", body: "\u6bcf\u5468\u56de\u6536\u4e00\u6bb5\u9ad8\u56de\u62a5\u65f6\u95f4" },
    ],
  },
  close: {
    slogan: "\u5728\u6bd4\u5947\u5821\uff0c\u65f6\u95f4\u4e5f\u53ea\u5956\u52b1\u957f\u671f\u4e3b\u4e49",
    cta: "\u4ece\u4eca\u5929\u8d77\uff0c\u5148\u6362\u6389\u4e00\u4e2a\u4f4e\u56de\u62a5\u52a8\u4f5c"
  },
};
