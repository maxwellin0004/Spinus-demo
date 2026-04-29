export type TaxonomyPose =
  | "bed_phone"
  | "curled_scroll"
  | "one_hand_slouch"
  | "desk_scroll"
  | "walking_phone"
  | "blanket_phone";

export type TaxonomyItem = {
  id: string;
  letter: string;
  label: string;
  pose: TaxonomyPose;
  imageSrc?: string;
  shortTrait: string;
};

export type TaxonomyTimelineSegment = {
  id: string;
  startFrame: number;
  endFrame: number;
  sceneType: "TaxonomyOpenerScene" | "PostureStripScene" | "CaptionRevealScene" | "ResultPromptScene";
  caption: string;
  activeItemIds: string[];
  voiceId: string;
};

export const SLEEP_POSTURE_TAXONOMY_FPS = 30;
export const SLEEP_POSTURE_TAXONOMY_DURATION_IN_FRAMES = 42 * SLEEP_POSTURE_TAXONOMY_FPS;

export const sleepPostureTaxonomyData = {
  meta: {
    templateId: "sleep_posture_taxonomy_card",
    topic: "你是哪种刷手机姿势？",
    orientation: "horizontal",
    durationSec: 42,
    styleVariant: "clean_white_psychology_card",
    timingStatus: "estimated_after_audio_duration_fit",
  },
  header: {
    channelLabel: "手机姿势暴露状态",
    eyebrow: "心理知识｜从刷手机姿势看放松方式",
    question: "你是哪种刷手机姿势",
    sourceNote: "@行为观察",
  },
  items: [
    {
      id: "bed_phone",
      letter: "A",
      label: "仰躺举屏型",
      pose: "bed_phone",
      imageSrc: "images/sleep-posture-taxonomy/bed_phone.png",
      shortTrait: "彻底放空",
    },
    {
      id: "curled_scroll",
      letter: "B",
      label: "蜷缩连刷型",
      pose: "curled_scroll",
      imageSrc: "images/sleep-posture-taxonomy/curled_scroll.png",
      shortTrait: "安全感充电",
    },
    {
      id: "one_hand_slouch",
      letter: "C",
      label: "歪坐单手型",
      pose: "one_hand_slouch",
      imageSrc: "images/sleep-posture-taxonomy/one_hand_slouch.png",
      shortTrait: "边看边飘",
    },
    {
      id: "desk_scroll",
      letter: "D",
      label: "趴桌偷看型",
      pose: "desk_scroll",
      imageSrc: "images/sleep-posture-taxonomy/desk_scroll.png",
      shortTrait: "假装忙碌",
    },
    {
      id: "walking_phone",
      letter: "E",
      label: "边走边刷型",
      pose: "walking_phone",
      imageSrc: "images/sleep-posture-taxonomy/walking_phone.png",
      shortTrait: "停不下来",
    },
    {
      id: "blanket_phone",
      letter: "F",
      label: "被窝夜刷型",
      pose: "blanket_phone",
      imageSrc: "images/sleep-posture-taxonomy/blanket_phone.png",
      shortTrait: "晚睡预警",
    },
  ] satisfies TaxonomyItem[],
  timeline: [
    {
      id: "scene_01",
      startFrame: 0,
      endFrame: 149,
      sceneType: "TaxonomyOpenerScene",
      caption: "刷手机姿势其实会暴露你的放松方式",
      activeItemIds: [],
      voiceId: "v01",
    },
    {
      id: "scene_02",
      startFrame: 150,
      endFrame: 299,
      sceneType: "PostureStripScene",
      caption: "同样是刷屏，每个人身体最诚实的反应都不一样",
      activeItemIds: [],
      voiceId: "v02",
    },
    {
      id: "scene_03",
      startFrame: 300,
      endFrame: 449,
      sceneType: "CaptionRevealScene",
      caption: "仰躺举屏的人，通常是真的想把脑子完全放空",
      activeItemIds: ["bed_phone"],
      voiceId: "v03",
    },
    {
      id: "scene_04",
      startFrame: 450,
      endFrame: 599,
      sceneType: "CaptionRevealScene",
      caption: "蜷缩连刷的人，刷的不是内容，是一点安全感",
      activeItemIds: ["curled_scroll"],
      voiceId: "v04",
    },
    {
      id: "scene_05",
      startFrame: 600,
      endFrame: 749,
      sceneType: "CaptionRevealScene",
      caption: "歪坐单手刷的人，注意力常常在现实和屏幕中间摇摆",
      activeItemIds: ["one_hand_slouch"],
      voiceId: "v05",
    },
    {
      id: "scene_06",
      startFrame: 750,
      endFrame: 929,
      sceneType: "CaptionRevealScene",
      caption: "趴桌偷看的人，往往是在忙碌里给自己偷一口气",
      activeItemIds: ["desk_scroll"],
      voiceId: "v06",
    },
    {
      id: "scene_07",
      startFrame: 930,
      endFrame: 1109,
      sceneType: "CaptionRevealScene",
      caption: "边走边刷的人，不是闲不住，是大脑很难真正停机",
      activeItemIds: ["walking_phone"],
      voiceId: "v07",
    },
    {
      id: "scene_08",
      startFrame: 1110,
      endFrame: 1259,
      sceneType: "ResultPromptScene",
      caption: "你是哪一种？把结果打在评论区",
      activeItemIds: [],
      voiceId: "v08",
    },
  ] satisfies TaxonomyTimelineSegment[],
} as const;
