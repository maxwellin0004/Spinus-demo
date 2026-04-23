import type { AudioLayerConfig } from "../lib/audioTypes";

export const newSignalsMacdVoiceoverText = [
  "最危险的时候，往往不是新闻在说什么，而是价格还在涨，内部动能却已经先掉队。",
  "很多人只看见价格冲高，却没看见 MACD 已经开始缩量、背离或者钝化。",
  "MACD 背离不是开仓按钮，而是趋势内部开始走弱的预警。",
  "真正成熟的用法，是先看结构，再看动能，最后等确认动作。",
  "它的价值，是让你更早意识到这段趋势没有表面看起来那么健康。",
].join(" ");

export const newSignalsAudio: AudioLayerConfig = {
  voiceover: {
    src: "/audio/new-signals/macd-warning-voiceover.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  bgm: {
    src: "/audio/new-signals/financial-tension-low.mp3",
    startFrame: 0,
    volume: 0.22,
    loop: true,
    enabled: false,
  },
  sfx: [
    {
      src: "/audio/sfx/headline-hit-01.mp3",
      startFrame: 18,
      volume: 0.72,
      enabled: false,
    },
    {
      src: "/audio/sfx/stat-impact-01.mp3",
      startFrame: 246,
      volume: 0.68,
      enabled: false,
    },
    {
      src: "/audio/sfx/chart-tick-01.mp3",
      startFrame: 513,
      volume: 0.35,
      enabled: false,
    },
    {
      src: "/audio/sfx/panel-swish-01.mp3",
      startFrame: 825,
      volume: 0.44,
      enabled: false,
    },
    {
      src: "/audio/sfx/checklist-click-01.mp3",
      startFrame: 1449,
      volume: 0.42,
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
      endFrame: 230,
      text: "最危险的时候，往往不是新闻在说什么，\n而是价格还在涨时，内部动能已经先掉队。",
      emphasisWords: ["内部动能", "先掉队"],
    },
    {
      startFrame: 240,
      endFrame: 470,
      text: "很多人只看见价格冲高，\n却没看见 MACD 已经开始缩量、背离或者钝化。",
      emphasisWords: ["价格冲高", "MACD", "背离"],
    },
    {
      startFrame: 480,
      endFrame: 770,
      text: "MACD 背离不是开仓按钮，\n而是趋势内部开始走弱的预警。",
      emphasisWords: ["不是开仓按钮", "预警"],
    },
    {
      startFrame: 780,
      endFrame: 1350,
      text: "真正成熟的用法，是先看结构，\n再看动能，最后等确认动作。",
      emphasisWords: ["先看结构", "等确认动作"],
    },
    {
      startFrame: 1360,
      endFrame: 1799,
      text: "它的价值，是让你更早意识到\n这段趋势没有表面看起来那么健康。",
      emphasisWords: ["更早意识到", "没有那么健康"],
    },
  ],
};
