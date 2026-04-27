import type { AudioLayerConfig } from "../lib/audioTypes";

export const cognitiveDocumentaryAlignedAudio: AudioLayerConfig = {
  voiceover: {
    src: "/audio/cognitive-documentary-essay/meeting-no-conclusion-elevenlabs.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  bgm: null,
  sfx: [],
  subtitles: [
  {
    "startFrame": 0,
    "endFrame": 130,
    "text": "真正拉开团队效率差距的，不是谁说得更多。\nWhat really separates team efficiency is not who talks more.",
    "emphasisWords": [
      "团队效率",
      "不是"
    ]
  },
  {
    "startFrame": 133,
    "endFrame": 276,
    "text": "而是谁能把混乱的信息，压缩成一个清晰结构。\nIt is who can compress chaotic information into a clear structure.",
    "emphasisWords": [
      "混乱",
      "清晰结构"
    ]
  },
  {
    "startFrame": 280,
    "endFrame": 442,
    "text": "会议卡住时，表面上是观点不同，底层其实是标准不同。\nWhen a meeting gets stuck, the surface problem is opinions, but the deeper problem is standards.",
    "emphasisWords": [
      "观点不同",
      "标准不同"
    ]
  },
  {
    "startFrame": 444,
    "endFrame": 631,
    "text": "有人在判断风险，有人在争取资源，有人只是在避免承担责任。\nSome people judge risk, some fight for resources, and some avoid responsibility.",
    "emphasisWords": [
      "风险",
      "资源",
      "责任"
    ]
  },
  {
    "startFrame": 634,
    "endFrame": 835,
    "text": "所以真正有效的主持人，不是让每个人都发言，而是先把要做的决定说清楚。\nAn effective facilitator does not just let everyone speak. They define the decision first.",
    "emphasisWords": [
      "主持人",
      "决定"
    ]
  },
  {
    "startFrame": 838,
    "endFrame": 953,
    "text": "表达越清晰，协作越容易进入正向循环。\nThe clearer the expression, the easier collaboration enters a positive loop.",
    "emphasisWords": [
      "表达",
      "正向循环"
    ]
  }
],
};
