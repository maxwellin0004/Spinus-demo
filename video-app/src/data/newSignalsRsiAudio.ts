import type { AudioLayerConfig } from "../lib/audioTypes";

export const newSignalsRsiVoiceoverText = [
  "当所有人都在说还会继续涨的时候，你最该看的往往不是标题，而是动能有没有先转弱。",
  "RSI 真正的价值，不是让你看到七十就立刻反手，而是提醒你热度、强度和风险阶段。",
  "更稳的顺序是，先看趋势，再看区间和钝化，最后等价格确认。",
  "RSI 不是替你按买卖按钮，而是帮你少在情绪最满的时候做错误决定。",
].join(" ");

export const newSignalsRsiAudio: AudioLayerConfig = {
  voiceover: {
    src: "/audio/new-signals/rsi-strategy-voiceover.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  bgm: {
    src: "/audio/new-signals/financial-tension-low.mp3",
    startFrame: 0,
    volume: 0.2,
    loop: true,
    enabled: false,
  },
  sfx: [
    {
      src: "/audio/sfx/headline-hit-01.mp3",
      startFrame: 16,
      volume: 0.68,
      enabled: false,
    },
    {
      src: "/audio/sfx/chart-tick-01.mp3",
      startFrame: 390,
      volume: 0.32,
      enabled: false,
    },
  ],
  duckingRules: [
    {
      target: "bgm",
      when: "voiceover_active",
      gain: 0.35,
    },
  ],
  subtitles: [
    {
      startFrame: 0,
      endFrame: 170,
      text: "当所有人都在说还会继续涨的时候，\n你最该看的往往不是标题，而是动能有没有先转弱。",
      emphasisWords: ["不是标题", "动能", "转弱"],
    },
    {
      startFrame: 180,
      endFrame: 350,
      text: "RSI 真正的价值，不是让你看到 70 就立刻反手，\n而是提醒你热度、强度和风险阶段。",
      emphasisWords: ["不是", "热度", "风险阶段"],
    },
    {
      startFrame: 360,
      endFrame: 870,
      text: "更稳的顺序是，先看趋势，\n再看区间和钝化，最后等价格确认。",
      emphasisWords: ["先看趋势", "最后等价格确认"],
    },
    {
      startFrame: 880,
      endFrame: 1799,
      text: "RSI 不是替你按买卖按钮，\n而是帮你少在情绪最满的时候做错误决定。",
      emphasisWords: ["不是", "错误决定"],
    },
  ],
};
