import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const macdIndicatorAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/new-signals/macd-indicator-voiceover.mp3",
  voiceoverEnabled: true,
  subtitles: [
    {
      startFrame: 0,
      endFrame: 329,
      text: "最危险的时候，往往不是新闻在说什么，\n而是价格还在涨，内部动能却已经先走弱。",
      emphasisWords: ["内部动能", "先走弱"],
    },
    {
      startFrame: 330,
      endFrame: 719,
      text: "很多人只看价格创新高，\n却没看到 MACD 已经开始缩量、背离或者钝化。",
      emphasisWords: ["价格创新高", "MACD", "背离"],
    },
    {
      startFrame: 720,
      endFrame: 1139,
      text: "MACD 的价值，不是替你一键开仓，\n而是更早告诉你趋势内部没有表面看起来那么强。",
      emphasisWords: ["不是替你一键开仓", "趋势内部"],
    },
    {
      startFrame: 1140,
      endFrame: 1499,
      text: "更稳的用法，是先看结构，再看动能，\n最后等价格确认动作，而不是只盯一个金叉死叉。",
      emphasisWords: ["先看结构", "等价格确认"],
    },
    {
      startFrame: 1500,
      endFrame: 1799,
      text: "所以 MACD 真正适合做的，是趋势健康度判断和风险预警，\n不是情绪上头时的冲动按钮。",
      emphasisWords: ["风险预警", "冲动按钮"],
    },
  ],
});
