import type { AudioLayerConfig } from "../../lib/audioTypes";
import { createVoiceOnlyAudioConfig } from "../../audioPresets";

export const voiceoverAudio: AudioLayerConfig = {
  ...createVoiceOnlyAudioConfig({
    voiceoverSrc: "/generated-jobs/frontend_delivery_smoke/sharp_contrarian/voiceover.mp3",
    subtitles: [
  {
    "startFrame": 0,
    "endFrame": 120,
    "text": "你不是懒，\n你只是把开始这件事设计得太重了。",
    "emphasisWords": [
      "不是懒",
      "启动成本"
    ]
  },
  {
    "startFrame": 0,
    "endFrame": 420,
    "text": "拖延不是突然发生的。通常是任务太模糊，第一步太大，反馈又太晚。\n大脑看不到立刻开始的好处，就会自动选择更轻松的事。",
    "emphasisWords": [
      "模糊",
      "第一步",
      "反馈"
    ]
  },
  {
    "startFrame": 0,
    "endFrame": 270,
    "text": "先别要求自己坚持一小时。只做三件事：写下第一步，\n把工具提前放好，把开始时间压到三十秒。",
    "emphasisWords": [
      "第一步",
      "30秒",
      "开始"
    ]
  },
  {
    "startFrame": 0,
    "endFrame": 90,
    "text": "真正要改的不是你这个人，\n而是你开始之前的设计。",
    "emphasisWords": [
      "设计",
      "开始"
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
