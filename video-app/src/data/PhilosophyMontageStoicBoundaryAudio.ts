import { createVoiceOnlyAudioConfig } from "./audioPresets";

export const stoicBoundarySubtitleCues = [
  {
    startFrame: 0,
    endFrame: 115,
    text: "今天我们要讲的，\n是斯多葛主义。",
    emphasisWords: ["斯多葛主义"],
  },
  {
    startFrame: 120,
    endFrame: 312,
    text: "它不是让你没情绪，\n而是让你别把外界刺激都请进内心。",
    emphasisWords: ["外界刺激", "内心"],
  },
  {
    startFrame: 316,
    endFrame: 660,
    text: "一句评价、一条消息、一次冷脸，本来只是事件。\n你一旦反复回放，它就会变成情绪占领。",
    emphasisWords: ["事件", "反复回放", "情绪占领"],
  },
  {
    startFrame: 665,
    endFrame: 970,
    text: "斯多葛主义最核心的一步，不是压住情绪。\n而是先切开两层：外界发生了什么，和我怎么解释它。",
    emphasisWords: ["两层", "解释它"],
  },
  {
    startFrame: 972,
    endFrame: 1130,
    text: "准备回复、争辩、证明自己之前，\n先停一秒。",
    emphasisWords: ["先停一秒"],
  },
  {
    startFrame: 1133,
    endFrame: 1289,
    text: "问一句：这件事，\n到底属于我能控制的部分吗？",
    emphasisWords: ["能控制"],
  },
  {
    startFrame: 1291,
    endFrame: 1586,
    text: "当你守住内心入口，情绪不会立刻消失。\n但它不会再接管你。这，就是斯多葛主义真正有用的地方。",
    emphasisWords: ["内心入口", "不会再接管", "真正有用"],
  },
];

export const stoicBoundaryAudio = createVoiceOnlyAudioConfig({
  voiceoverSrc: "/audio/philosophy-montage/stoic-boundary-elevenlabs-cn.mp3",
  subtitles: stoicBoundarySubtitleCues,
  voiceoverEnabled: true,
});
