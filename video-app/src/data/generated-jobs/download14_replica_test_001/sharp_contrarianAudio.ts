import type { AudioLayerConfig } from "../../lib/audioTypes";
import { createVoiceOnlyAudioConfig } from "../../audioPresets";

export const voiceoverAudio: AudioLayerConfig = {
  ...createVoiceOnlyAudioConfig({
    voiceoverSrc: "/generated-jobs/download14_replica_test_001/sharp_contrarian/voiceover.mp3",
    subtitles: [
  {
    "startFrame": 0,
    "endFrame": 314,
    "text": "你不是缺模板，你缺的是一套能复用的拆解标准。\n爆款视频最值钱的不是某个画面，而是它怎么开头、怎么转折、怎么把人留住。",
    "emphasisWords": [
      "模板",
      "拆解标准"
    ]
  },
  {
    "startFrame": 322,
    "endFrame": 638,
    "text": "很多人复刻爆款，第一步就是截图、仿配色、换几个字。\n结果画面看起来像，节奏是散的，文案是平的，观众三秒就划走。",
    "emphasisWords": [
      "照抄",
      "节奏",
      "文案"
    ]
  },
  {
    "startFrame": 641,
    "endFrame": 1133,
    "text": "真正要复制的不是原视频本身，而是三层结构。第一层是钩子，先制造反差。第二层是信息推进，\n每十二秒换一个功能段。第三层是画面节奏，让素材、字幕和配音一起推着往前走。",
    "emphasisWords": [
      "钩子",
      "推进",
      "节奏"
    ]
  },
  {
    "startFrame": 1135,
    "endFrame": 1596,
    "text": "所以这个流程不能只靠人手调。先拆解参考视频，再匹配本地模板，接着重写文案、\n生成画面、配音对齐，最后直接渲染成片。这样复刻的不是皮，而是能持续生产的结构。",
    "emphasisWords": [
      "自动化",
      "复刻流程"
    ]
  }
],
    voiceoverEnabled: true,
  }),
  subtitleStyle: {
    fontSize: 36,
    color: "#ffffff",
  },
};
