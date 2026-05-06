import type { AudioLayerConfig } from "../../lib/audioTypes";
import { createVoiceOnlyAudioConfig } from "../../audioPresets";

export const voiceoverAudio: AudioLayerConfig = {
  ...createVoiceOnlyAudioConfig({
    voiceoverSrc: "/generated-jobs/ai_fomo_template_001/sharp_contrarian/voiceover.mp3",
    subtitles: [
  {
    "startFrame": 0,
    "endFrame": 38,
    "text": "别先找模板。",
    "emphasisWords": [
      "模板",
      "抓人"
    ]
  },
  {
    "startFrame": 38,
    "endFrame": 134,
    "text": "先看它第一秒用什么东西抓住你。",
    "emphasisWords": [
      "模板",
      "抓人"
    ]
  },
  {
    "startFrame": 138,
    "endFrame": 252,
    "text": "第二步，\n把画面拆成骨架：标题在哪，",
    "emphasisWords": [
      "视觉骨架",
      "留白"
    ]
  },
  {
    "startFrame": 252,
    "endFrame": 367,
    "text": "字幕在哪，主体在哪，\n哪里必须留白。",
    "emphasisWords": [
      "视觉骨架",
      "留白"
    ]
  },
  {
    "startFrame": 371,
    "endFrame": 415,
    "text": "特效也要拆。",
    "emphasisWords": [
      "动效",
      "节奏"
    ]
  },
  {
    "startFrame": 415,
    "endFrame": 510,
    "text": "网格、闪光、缩放、故障感，",
    "emphasisWords": [
      "动效",
      "节奏"
    ]
  },
  {
    "startFrame": 510,
    "endFrame": 590,
    "text": "分别卡在哪个信息点上。",
    "emphasisWords": [
      "动效",
      "节奏"
    ]
  },
  {
    "startFrame": 598,
    "endFrame": 723,
    "text": "然后拆声音。\n底部字幕必须跟配音一致，",
    "emphasisWords": [
      "声音",
      "字幕"
    ]
  },
  {
    "startFrame": 723,
    "endFrame": 792,
    "text": "视觉标题只负责强调。",
    "emphasisWords": [
      "声音",
      "字幕"
    ]
  },
  {
    "startFrame": 794,
    "endFrame": 902,
    "text": "接着换成新选题。\n我们保留它的结构，",
    "emphasisWords": [
      "新选题",
      "结构"
    ]
  },
  {
    "startFrame": 902,
    "endFrame": 991,
    "text": "不复制原文，也不复制原画面。",
    "emphasisWords": [
      "新选题",
      "结构"
    ]
  },
  {
    "startFrame": 996,
    "endFrame": 1083,
    "text": "生成图片时，也要按安全区来。",
    "emphasisWords": [
      "安全区",
      "字幕"
    ]
  },
  {
    "startFrame": 1083,
    "endFrame": 1176,
    "text": "文字区要干净，主体不能挡字幕。",
    "emphasisWords": [
      "安全区",
      "字幕"
    ]
  },
  {
    "startFrame": 1181,
    "endFrame": 1305,
    "text": "渲染时，模板读取参数。\n该横移就横移，",
    "emphasisWords": [
      "模板",
      "参数"
    ]
  },
  {
    "startFrame": 1305,
    "endFrame": 1402,
    "text": "该脉冲就脉冲，该网格就网格。",
    "emphasisWords": [
      "模板",
      "参数"
    ]
  },
  {
    "startFrame": 1405,
    "endFrame": 1453,
    "text": "最后重新配音。",
    "emphasisWords": [
      "配音",
      "音频时间轴"
    ]
  },
  {
    "startFrame": 1453,
    "endFrame": 1549,
    "text": "字幕直接从音频时间轴切出来，",
    "emphasisWords": [
      "配音",
      "音频时间轴"
    ]
  },
  {
    "startFrame": 1549,
    "endFrame": 1625,
    "text": "这样听到和看到才一致。",
    "emphasisWords": [
      "配音",
      "音频时间轴"
    ]
  },
  {
    "startFrame": 1627,
    "endFrame": 1693,
    "text": "所以复刻的不是一条视频，",
    "emphasisWords": [
      "系统",
      "反复生产"
    ]
  },
  {
    "startFrame": 1693,
    "endFrame": 1769,
    "text": "而是一套可以反复生产的系统。",
    "emphasisWords": [
      "系统",
      "反复生产"
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
