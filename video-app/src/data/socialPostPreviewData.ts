export const SOCIAL_POST_TEMPLATE_ID = "social_post_overlay_card";
export const SOCIAL_POST_PREVIEW_FPS = 30;

export type SocialPostOverlayTemplateData = {
  meta: {
    templateId: string;
    topic: string;
    orientation: "vertical";
    durationSec: number;
    styleVariant: string;
  };
  background: {
    imageSrc: string;
    location: string;
    sideBlur: boolean;
  };
  card: {
    anchor: "upper-center";
    width: number;
    top: number;
    left: number;
    avatarText: string;
  };
  post: {
    author: string;
    badge: string;
    metaLine: string;
    paragraphs: string[];
  };
  motion: {
    backgroundScaleFrom: number;
    backgroundScaleTo: number;
    backgroundShiftY: number;
    cardTranslateYIn: number;
    cardScaleFrom: number;
    glowPeakOpacity: number;
  };
};

export const socialPostPreviewData: SocialPostOverlayTemplateData = {
  meta: {
    templateId: SOCIAL_POST_TEMPLATE_ID,
    topic: "城市夜景帖文浮层预览",
    orientation: "vertical",
    durationSec: 10,
    styleVariant: "warm-paper-night-street",
  },
  background: {
    imageSrc: "images/social-post-preview/night-street-background.png",
    location: "上海",
    sideBlur: true,
  },
  card: {
    anchor: "upper-center",
    width: 680,
    top: 168,
    left: 166,
    avatarText: "YD",
  },
  post: {
    author: "城市夜读局",
    badge: "创作人",
    metaLine: "04-28 21:17 来自 iPhone 15 Pro",
    paragraphs: [
      "真正能让人平静下来的，不是答案，而是你终于允许自己先停一停。",
      "允许事情暂时没有结果，允许关系里有沉默，允许你今晚只做一件小事。",
      "很多时候，生活不是马上变好，而是你不再急着证明自己过得好。",
    ],
  },
  motion: {
    backgroundScaleFrom: 1.04,
    backgroundScaleTo: 1.1,
    backgroundShiftY: -60,
    cardTranslateYIn: 90,
    cardScaleFrom: 0.94,
    glowPeakOpacity: 0.8,
  },
};

export const SOCIAL_POST_PREVIEW_DURATION_IN_FRAMES =
  socialPostPreviewData.meta.durationSec * SOCIAL_POST_PREVIEW_FPS;
