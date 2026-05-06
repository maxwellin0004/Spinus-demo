import type { AudioLayerConfig } from "../../lib/audioTypes";
import { createVoiceOnlyAudioConfig } from "../../audioPresets";

export const voiceoverAudio: AudioLayerConfig = {
  ...createVoiceOnlyAudioConfig({
    voiceoverSrc: "/generated-jobs/viral_test_adapter_001/codex_sharp_contrarian/voiceover.mp3",
    subtitles: [
  {
    "startFrame": 0,
    "endFrame": 127,
    "text": "你不是拖延，\n你只是把开始入口设得太重。",
    "emphasisWords": [
      "不是拖延",
      "开始入口",
      "太重"
    ]
  },
  {
    "startFrame": 134,
    "endFrame": 466,
    "text": "拖延不是坐下之后才发生的。它通常在开始之前就出现：任务太模糊，\n第一步太大，反馈又太远，大脑自然会先选更轻松的事。",
    "emphasisWords": [
      "开始之前",
      "任务太模糊",
      "第一步太大",
      "反馈太远"
    ]
  },
  {
    "startFrame": 470,
    "endFrame": 742,
    "text": "先别逼自己坚持。只做三件事：写下第一步，\n提前摆好工具，把启动动作压到三十秒内。",
    "emphasisWords": [
      "第一步",
      "工具",
      "三十秒"
    ]
  },
  {
    "startFrame": 749,
    "endFrame": 830,
    "text": "别急着改人，先把入口改轻。",
    "emphasisWords": [
      "改人",
      "入口"
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
