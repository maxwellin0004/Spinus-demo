import type { AudioLayerConfig, SubtitleCue } from "../lib/audioTypes";

export type CognitiveDocMotion =
  | "slow_push"
  | "slow_pan_left"
  | "slow_pan_right"
  | "static_hold"
  | "impact_zoom";

export type CognitiveDocScene = {
  sceneId: string;
  sceneType:
    | "DustLibraryHookScene"
    | "BrollEvidenceScene"
    | "ChapterImpactWordScene"
    | "ContradictionCaseScene"
    | "RuleExtractionScene"
    | "DocumentaryCloseScene";
  startSec: number;
  durationSec: number;
  visual: {
    asset: string;
    assetMode?: "generated" | "local_fallback" | "licensed_external" | "recorded_screen";
    assetPromptId?: string;
    assetPrompt?: string;
    negativePrompt?: string;
    generatedAssetPath?: string;
    fallbackAsset?: string;
    motion: CognitiveDocMotion;
    overlayText?: string | null;
    tint: "warm_archive" | "cool_institutional" | "high_contrast_warning";
  };
  caption: {
    zh: string;
    en: string;
  };
};

export const COGNITIVE_DOC_FPS = 30;
export const COGNITIVE_DOC_DURATION_SEC = 30;
export const COGNITIVE_DOC_DURATION_IN_FRAMES =
  COGNITIVE_DOC_FPS * COGNITIVE_DOC_DURATION_SEC;

export const cognitiveDocumentaryScenes: CognitiveDocScene[] = [
  {
    sceneId: "s01",
    sceneType: "DustLibraryHookScene",
    startSec: 0,
    durationSec: 4,
    visual: {
      asset: "images/philosophy-montage/office_desk.jpg",
      assetMode: "local_fallback",
      assetPromptId: "doc_hook_symbolic_environment",
      generatedAssetPath:
        "generated/cognitive-documentary-essay/meeting-no-conclusion/s01_hook_workspace.png",
      fallbackAsset: "images/philosophy-montage/office_desk.jpg",
      motion: "slow_push",
      tint: "warm_archive",
    },
    caption: {
      zh: "真正拉开团队效率差距的",
      en: "What really separates team efficiency",
    },
  },
  {
    sceneId: "s02",
    sceneType: "BrollEvidenceScene",
    startSec: 4,
    durationSec: 4,
    visual: {
      asset: "images/shared/scenario_ppt.jpg",
      assetMode: "local_fallback",
      assetPromptId: "doc_process_or_structure_surface",
      generatedAssetPath:
        "generated/cognitive-documentary-essay/meeting-no-conclusion/s02_clear_structure.png",
      fallbackAsset: "images/shared/scenario_ppt.jpg",
      motion: "slow_pan_left",
      overlayText: "清晰结构",
      tint: "warm_archive",
    },
    caption: {
      zh: "不是谁说得更多",
      en: "is not who talks more",
    },
  },
  {
    sceneId: "s03",
    sceneType: "ChapterImpactWordScene",
    startSec: 8,
    durationSec: 5,
    visual: {
      asset: "images/philosophy-montage/screen_overload_wall.png",
      assetMode: "local_fallback",
      assetPromptId: "doc_chapter_impact_metaphor",
      generatedAssetPath:
        "generated/cognitive-documentary-essay/meeting-no-conclusion/s03_hidden_disagreement.png",
      fallbackAsset: "images/philosophy-montage/screen_overload_wall.png",
      motion: "impact_zoom",
      overlayText: "隐形分歧",
      tint: "high_contrast_warning",
    },
    caption: {
      zh: "而是谁能把分歧命名出来",
      en: "but who can name the hidden disagreement",
    },
  },
  {
    sceneId: "s04",
    sceneType: "ContradictionCaseScene",
    startSec: 13,
    durationSec: 5,
    visual: {
      asset: "images/corporate-retreat-dossier/boardroom.png",
      assetMode: "local_fallback",
      assetPromptId: "doc_workplace_case_broll",
      generatedAssetPath:
        "generated/cognitive-documentary-essay/meeting-no-conclusion/s04_meeting_case.png",
      fallbackAsset: "images/corporate-retreat-dossier/boardroom.png",
      motion: "slow_push",
      tint: "cool_institutional",
    },
    caption: {
      zh: "很多会议看起来在讨论方案",
      en: "Many meetings seem to discuss a plan",
    },
  },
  {
    sceneId: "s06",
    sceneType: "RuleExtractionScene",
    startSec: 18,
    durationSec: 7,
    visual: {
      asset: "images/shared/scenario_video_breakdown.jpg",
      assetMode: "local_fallback",
      assetPromptId: "doc_rule_extraction_visual",
      generatedAssetPath:
        "generated/cognitive-documentary-essay/meeting-no-conclusion/s06_decision_logic.png",
      fallbackAsset: "images/shared/scenario_video_breakdown.jpg",
      motion: "slow_push",
      overlayText: "底层逻辑",
      tint: "warm_archive",
    },
    caption: {
      zh: "先定义要做什么决定",
      en: "Define the decision first",
    },
  },
  {
    sceneId: "s07",
    sceneType: "DocumentaryCloseScene",
    startSec: 25,
    durationSec: 5,
    visual: {
      asset: "images/philosophy-montage/focus_budget_workspace.png",
      assetMode: "local_fallback",
      assetPromptId: "doc_close_resolution_image",
      generatedAssetPath:
        "generated/cognitive-documentary-essay/meeting-no-conclusion/s07_positive_loop.png",
      fallbackAsset: "images/philosophy-montage/focus_budget_workspace.png",
      motion: "slow_pan_left",
      overlayText: "正向循环",
      tint: "warm_archive",
    },
    caption: {
      zh: "再让表达服务于这个决定",
      en: "then make expression serve that decision",
    },
  },
];

export const cognitiveDocumentarySubtitles: SubtitleCue[] = [
  {
    startFrame: 60,
    endFrame: 149,
    text: "真正拉开团队效率差距的\nWhat really separates team efficiency",
    emphasisWords: ["团队效率"],
  },
  {
    startFrame: 180,
    endFrame: 329,
    text: "不是谁说得更多\nis not who talks more",
    emphasisWords: ["不是"],
  },
  {
    startFrame: 390,
    endFrame: 509,
    text: "而是谁能把分歧命名出来\nbut who can name the hidden disagreement",
    emphasisWords: ["分歧"],
  },
  {
    startFrame: 540,
    endFrame: 839,
    text: "很多会议看起来在讨论方案\nMany meetings seem to discuss a plan",
    emphasisWords: ["讨论方案"],
  },
  {
    startFrame: 900,
    endFrame: 1169,
    text: "其实每个人心里用的是不同标准\nbut everyone uses a different standard",
    emphasisWords: ["不同标准"],
  },
  {
    startFrame: 1200,
    endFrame: 1439,
    text: "先定义要做什么决定\nDefine the decision first",
    emphasisWords: ["决定"],
  },
  {
    startFrame: 1470,
    endFrame: 1769,
    text: "再让表达服务于这个决定\nthen make expression serve that decision",
    emphasisWords: ["表达"],
  },
];

export const cognitiveDocumentaryAudio: AudioLayerConfig = {
  voiceover: null,
  bgm: null,
  sfx: [],
  subtitles: cognitiveDocumentarySubtitles,
};
