import type { AudioLayerConfig, SubtitleCue } from "../lib/audioTypes";

export type ParadoxScene =
  | {
      id: "scene_01";
      type: "ParadoxColdOpenScene";
      startFrame: number;
      durationInFrames: number;
      headlineValue: string;
      badgeCount: number;
      accentPhrase: string;
    }
  | {
      id: "scene_02";
      type: "RuleTheaterScene";
      startFrame: number;
      durationInFrames: number;
      nodeCount: number;
      pairCounterTarget: number;
    }
  | {
      id: "scene_03";
      type: "MechanismGridScene";
      startFrame: number;
      durationInFrames: number;
      focusIndex: number;
      connectionTarget: number;
    }
  | {
      id: "scene_04";
      type: "ProbabilityBoardScene";
      startFrame: number;
      durationInFrames: number;
      probabilityValue: number;
    }
  | {
      id: "scene_05";
      type: "ReflectiveCloseScene";
      startFrame: number;
      durationInFrames: number;
      leftLabel: string;
      rightLabel: string;
      closingRule: string;
    };

export const COMBINATORIAL_PARADOX_FPS = 30;
export const COMBINATORIAL_PARADOX_DURATION = 1380;

export const combinatorialParadoxScenes: ParadoxScene[] = [
  {
    id: "scene_01",
    type: "ParadoxColdOpenScene",
    startFrame: 0,
    durationInFrames: 300,
    headlineValue: "50.7%",
    badgeCount: 23,
    accentPhrase: "23 人",
  },
  {
    id: "scene_02",
    type: "RuleTheaterScene",
    startFrame: 300,
    durationInFrames: 215,
    nodeCount: 23,
    pairCounterTarget: 253,
  },
  {
    id: "scene_03",
    type: "MechanismGridScene",
    startFrame: 515,
    durationInFrames: 186,
    focusIndex: 22,
    connectionTarget: 22,
  },
  {
    id: "scene_04",
    type: "ProbabilityBoardScene",
    startFrame: 701,
    durationInFrames: 353,
    probabilityValue: 50.7,
  },
  {
    id: "scene_05",
    type: "ReflectiveCloseScene",
    startFrame: 1054,
    durationInFrames: 326,
    leftLabel: "单点直觉",
    rightLabel: "成组关系",
    closingRule: "别用单点直觉看组合世界",
  },
];

export const combinatorialParadoxSubtitleCues: SubtitleCue[] = [
  { startFrame: 0, endFrame: 149, text: "只要二十三个人，\n同一天生日撞上的概率就已经超过一半。", emphasisWords: ["二十三个人", "超过一半"] },
  { startFrame: 151, endFrame: 298, text: "这不是直觉错一点，\n而是你的计数方式从一开始就错了。", emphasisWords: ["计数方式"] },
  { startFrame: 300, endFrame: 511, text: "大多数人会盯着三百六十五天，\n却忽略了二十三个人之间会产生二百五十三组配对。", emphasisWords: ["三百六十五天", "二百五十三组配对"] },
  { startFrame: 515, endFrame: 698, text: "每多一个人，\n不是多一个可能，而是同时和前面所有人都新增一次比较。", emphasisWords: ["所有人", "新增一次比较"] },
  { startFrame: 701, endFrame: 862, text: "所以概率上升得不是线性，\n而是组合数在把空间快速压扁。", emphasisWords: ["不是线性", "组合数"] },
  { startFrame: 865, endFrame: 1049, text: "当人数来到二十三，\n至少一对同生日的概率大约是百分之五十点七。", emphasisWords: ["二十三", "百分之五十点七"] },
  { startFrame: 1054, endFrame: 1222, text: "这类悖论真正提醒你的，\n是别再用单点直觉去看成组关系。", emphasisWords: ["单点直觉", "成组关系"] },
  { startFrame: 1226, endFrame: 1354, text: "很多看上去不可能的事，\n换一个计数框架，立刻就变得合理。", emphasisWords: ["计数框架"] },
];

export const combinatorialParadoxAudioConfig: AudioLayerConfig = {
  voiceover: {
    src: "/audio/combinatorial-paradox/birthday-paradox-elevenlabs.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  bgm: null,
  sfx: [],
};
