import type { AudioLayerConfig } from "../lib/audioTypes";

export const minimalPsychVoiceoverText = [
  "为什么一件事已经过去了，你的脑子里却还在一遍遍 replay。",
  "你不是不知道别想了，而是总觉得，只要再想一会儿，就能把它想明白。",
  "心理学里，这更像一种反刍思维。它看起来像分析，实际上却让你停在原地。",
  "它也像一个越拉越紧的绳结。你越想一次解决，它反而越难松开。",
  "想打断这种循环，不是逼自己立刻想通，而是先暂停追问为什么，把脑中的内容写下来，再做一个现实里的小动作。",
  "当你不再逼自己立刻想明白，脑子反而会慢慢安静下来。",
].join(" ");

export const minimalPsychExplainerAudio: AudioLayerConfig = {
  voiceover: {
    src: "/audio/minimal-psych/rumination-preview-voiceover.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  subtitles: [
    {
      startFrame: 0,
      endFrame: 158,
      text: "为什么一件事已经过去了，\n你的脑子里却还在一遍遍 replay。",
      emphasisWords: ["replay"],
    },
    {
      startFrame: 159,
      endFrame: 343,
      text: "你不是不知道别想了，\n而是总觉得，只要再想一会儿，就能把它想明白。",
      emphasisWords: ["想明白"],
    },
    {
      startFrame: 344,
      endFrame: 528,
      text: "心理学里，这更像一种反刍思维。\n它看起来像分析，实际上却让你停在原地。",
      emphasisWords: ["反刍思维", "停在原地"],
    },
    {
      startFrame: 529,
      endFrame: 713,
      text: "它也像一个越拉越紧的绳结。\n你越想一次解决，它反而越难松开。",
      emphasisWords: ["越拉越紧"],
    },
    {
      startFrame: 714,
      endFrame: 978,
      text: "想打断这种循环，不是逼自己立刻想通，\n而是先暂停追问为什么，把脑中的内容写下来，再做一个现实里的小动作。",
      emphasisWords: ["暂停", "写下来", "小动作"],
    },
    {
      startFrame: 979,
      endFrame: 1136,
      text: "当你不再逼自己立刻想明白，\n脑子反而会慢慢安静下来。",
      emphasisWords: ["安静下来"],
    },
  ],
};
