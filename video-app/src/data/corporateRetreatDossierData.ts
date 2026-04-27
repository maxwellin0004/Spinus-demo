import type { SubtitleCue } from "../lib/audioTypes";

export type DossierScene =
  | {
      id: string;
      type: "shockTitle";
      startFrame: number;
      durationInFrames: number;
      skylineLabel: string;
      headline: string;
      subline: string;
      assetSrc: string;
    }
  | {
      id: string;
      type: "statDossier";
      startFrame: number;
      durationInFrames: number;
      location: string;
      caption: string;
      statLines: string[];
      buildingLabel: string;
      assetSrc: string;
    }
  | {
      id: string;
      type: "evidenceMontage";
      startFrame: number;
      durationInFrames: number;
      caption: string;
      evidenceLabels: string[];
      palette: "factory" | "boardroom" | "construction";
      assetSrc: string;
    }
  | {
      id: string;
      type: "resolutionLedger";
      startFrame: number;
      durationInFrames: number;
      caption: string;
      thesis: string;
      bullets: string[];
      assetSrc: string;
    };

export const CORPORATE_RETREAT_DOSSIER_FPS = 30;
export const CORPORATE_RETREAT_DOSSIER_DURATION = 45 * CORPORATE_RETREAT_DOSSIER_FPS;

export const corporateRetreatDossierScenes: DossierScene[] = [
  {
    id: "scene_01",
    type: "shockTitle",
    startFrame: 0,
    durationInFrames: 90,
    skylineLabel: "锂电回收产业带",
    headline: "巨头退场",
    subline: "一场行业洗牌开始了",
    assetSrc: "images/corporate-retreat-dossier/city-aerial.png",
  },
  {
    id: "scene_02",
    type: "statDossier",
    startFrame: 90,
    durationInFrames: 180,
    location: "沿海产业园",
    caption: "上百家小厂同时收缩，只剩少数企业守住合规链条",
    statLines: ["退出 43% 小厂", "守住 12 个核心环节", "70% 利润集中在前处理"],
    buildingLabel: "REGIONAL MATERIALS HUB",
    assetSrc: "images/corporate-retreat-dossier/headquarters.png",
  },
  {
    id: "scene_03",
    type: "evidenceMontage",
    startFrame: 270,
    durationInFrames: 150,
    caption: "门店还亮着，但背后的供应链正在换人",
    evidenceLabels: ["门店仍在", "股权后移", "运营重组"],
    palette: "boardroom",
    assetSrc: "images/corporate-retreat-dossier/store-night.png",
  },
  {
    id: "scene_04",
    type: "evidenceMontage",
    startFrame: 420,
    durationInFrames: 210,
    caption: "真正的分水岭，不是价格，而是谁能把废料变成稳定产能",
    evidenceLabels: ["拆解线", "湿法车间", "检测报告"],
    palette: "factory",
    assetSrc: "images/corporate-retreat-dossier/factory-line.png",
  },
  {
    id: "scene_05",
    type: "evidenceMontage",
    startFrame: 630,
    durationInFrames: 210,
    caption: "资金、牌照和客户验证，开始同时压向同一张表",
    evidenceLabels: ["授信会议", "资质清单", "客户审厂"],
    palette: "boardroom",
    assetSrc: "images/corporate-retreat-dossier/boardroom.png",
  },
  {
    id: "scene_06",
    type: "evidenceMontage",
    startFrame: 780,
    durationInFrames: 150,
    caption: "所以新一轮扩产，不再是抢速度，而是抢确定性",
    evidenceLabels: ["新厂桩基", "自动化线", "长期订单"],
    palette: "construction",
    assetSrc: "images/corporate-retreat-dossier/construction.png",
  },
  {
    id: "scene_07",
    type: "resolutionLedger",
    startFrame: 930,
    durationInFrames: 420,
    caption: "最后留下来的公司，通常不是声音最大的，而是证据链最完整的",
    thesis: "行业退潮后，真正值钱的是可验证的供应链信用。",
    bullets: ["原料来源可追踪", "工艺数据可复核", "交付能力可审计"],
    assetSrc: "images/corporate-retreat-dossier/city-aerial.png",
  },
];

export const corporateRetreatDossierSubtitles: SubtitleCue[] = [
  { startFrame: 15, endFrame: 84, text: "一场行业洗牌开始了", emphasisWords: ["洗牌"] },
  { startFrame: 90, endFrame: 264, text: "上百家小厂同时收缩\n只剩少数企业守住合规链条", emphasisWords: ["收缩", "合规链条"] },
  { startFrame: 270, endFrame: 393, text: "这不是需求消失\n而是门槛突然抬高了", emphasisWords: ["门槛"] },
  { startFrame: 399, endFrame: 555, text: "门店还亮着\n但背后的供应链正在换人", emphasisWords: ["供应链"] },
  { startFrame: 564, endFrame: 747, text: "真正的分水岭\n不是价格，而是谁能把废料变成稳定产能", emphasisWords: ["稳定产能"] },
  { startFrame: 756, endFrame: 918, text: "资金、牌照和客户验证\n开始同时压向同一张表", emphasisWords: ["同一张表"] },
  { startFrame: 930, endFrame: 1065, text: "所以新一轮扩产\n不再是抢速度，而是抢确定性", emphasisWords: ["确定性"] },
  { startFrame: 1074, endFrame: 1152, text: "最后留下来的公司\n通常不是声音最大的", emphasisWords: ["留下来"] },
  { startFrame: 1153, endFrame: 1215, text: "而是证据链最完整的", emphasisWords: ["证据链"] },
];
