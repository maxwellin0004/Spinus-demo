import type { AudioLayerConfig } from "../../lib/audioTypes";
import { createVoiceOnlyAudioConfig } from "../../audioPresets";

export const voiceoverAudio: AudioLayerConfig = {
  ...createVoiceOnlyAudioConfig({
    voiceoverSrc: "/generated-jobs/download23_replica_real_001/sharp_contrarian/voiceover.mp3",
    subtitles: [
  {
    "startFrame": 0,
    "endFrame": 257,
    "text": "很多人复刻视频，第一步就错了。他们只盯着画面好不好看，\n却没有拆出它背后的布局、节奏和特效规则。",
    "emphasisWords": [
      "别再只问模板在哪"
    ]
  },
  {
    "startFrame": 259,
    "endFrame": 595,
    "text": "一个视频能不能复刻，关键不是你会不会生成图片，\n而是能不能把标题位置、字幕节奏、镜头运动、特效触发点全部拆出来。",
    "emphasisWords": [
      "先拆画面",
      "再谈复刻"
    ]
  },
  {
    "startFrame": 599,
    "endFrame": 850,
    "text": "好的布局会规定视线顺序。先给主标题，\n再给关键词，再用背景和动效把注意力推到下一段。",
    "emphasisWords": [
      "布局不是装饰",
      "是注意力路线"
    ]
  },
  {
    "startFrame": 853,
    "endFrame": 1087,
    "text": "特效不是越多越好。每一种效果都要对应一个信息点：强调、\n转折、推进，或者收束。",
    "emphasisWords": [
      "特效也不能乱加"
    ]
  },
  {
    "startFrame": 1090,
    "endFrame": 1358,
    "text": "如果只复刻文案，画面会散。如果只复刻画面，\n节奏会空。真正完整的流程，要同时复刻五层结构。",
    "emphasisWords": [
      "真正要复刻的是五层结构"
    ]
  },
  {
    "startFrame": 1361,
    "endFrame": 1692,
    "text": "所以第一步不是渲染，而是输出结构化分析。\n每个镜头都要写清楚：布局、字幕、镜头运动、特效、转场和可变项。",
    "emphasisWords": [
      "先生成视觉拆解表"
    ]
  },
  {
    "startFrame": 1695,
    "endFrame": 1922,
    "text": "第二步才是重写内容。我们不复制原文，\n也不复制原画面，只保留它让人停留的机制。",
    "emphasisWords": [
      "再生成新的复刻脚本"
    ]
  },
  {
    "startFrame": 1925,
    "endFrame": 2179,
    "text": "当这些规则都变成参数，程序就可以自动生成素材、\n配音对齐、套入动效，然后直接渲染成片。",
    "emphasisWords": [
      "最后交给程序渲染"
    ]
  },
  {
    "startFrame": 2182,
    "endFrame": 2458,
    "text": "这才是复刻爆款真正有价值的地方。不是抄一个视频，\n而是把一个好视频的结构，迁移成可以持续生产的工作流。",
    "emphasisWords": [
      "复刻不是抄",
      "是结构迁移"
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
