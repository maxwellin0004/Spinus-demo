import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import type { AudioLayerConfig } from "../lib/audioTypes";
import { TradingCaseShockScene } from "../scenes/trading/TradingCaseShockScene";
import { TradingChartCaseScene } from "../scenes/trading/TradingChartCaseScene";
import { TradingChecklistScene } from "../scenes/trading/TradingChecklistScene";
import { TradingIndicatorMechanismScene } from "../scenes/trading/TradingIndicatorMechanismScene";
import { TradingNewsContextScene } from "../scenes/trading/TradingNewsContextScene";
import { TradingRiskCloseScene } from "../scenes/trading/TradingRiskCloseScene";
import type { TradingSceneVariant } from "../scenes/trading/tradingSceneTheme";

export type TradingSignalTimeline = {
  news: number;
  hook: number;
  mechanism: number;
  case1: number;
  case2: number;
  case3: number;
  checklist: number;
  close: number;
};

export const DEFAULT_TRADING_SIGNAL_TIMELINE: TradingSignalTimeline = {
  news: 240,
  hook: 240,
  mechanism: 300,
  case1: 210,
  case2: 210,
  case3: 210,
  checklist: 330,
  close: 510,
};

export type TradingSignalData = {
  variant?: TradingSceneVariant;
  newsContext: React.ComponentProps<typeof TradingNewsContextScene>;
  hook: React.ComponentProps<typeof TradingCaseShockScene>;
  mechanism: React.ComponentProps<typeof TradingIndicatorMechanismScene>;
  cases: readonly [
    React.ComponentProps<typeof TradingChartCaseScene>,
    React.ComponentProps<typeof TradingChartCaseScene>,
    React.ComponentProps<typeof TradingChartCaseScene>,
  ];
  checklist: React.ComponentProps<typeof TradingChecklistScene>;
  close: React.ComponentProps<typeof TradingRiskCloseScene>;
};

export type TradingSignalCompositionProps = {
  backgroundColor?: string;
  timeline?: TradingSignalTimeline;
  audio?: AudioLayerConfig;
  data: TradingSignalData;
  variant?: TradingSceneVariant;
};

const stepBadges = ["\u7b2c\u4e00\u6b65", "\u7b2c\u4e8c\u6b65", "\u7b2c\u4e09\u6b65"] as const;

const toStaticAsset = (src?: string) => {
  if (!src) return src;
  if (/^https?:\/\//.test(src)) return src;
  if (/^\/?(images|generated-jobs|audio)\//.test(src)) return staticFile(src.replace(/^\/+/, ""));
  return src;
};

export const sanitizeTradingSignalData = (data: TradingSignalData, variant?: TradingSceneVariant): TradingSignalData => {
  const sceneVariant = variant ?? data.variant ?? "dark";

  return {
    ...data,
    variant: sceneVariant,
    newsContext: {
      ...data.newsContext,
      kicker: "",
      sourceLabel: "",
      tags: [],
      mediaCards: data.newsContext.mediaCards.map((card) => ({
        ...card,
        caption: "",
      })),
      variant: sceneVariant,
    },
    hook: {
      ...data.hook,
      kicker: "",
      stat: "",
      sourceLabel: "",
      boardLines: [],
      variant: sceneVariant,
    },
    mechanism: {
      ...data.mechanism,
      tag: "",
      variant: sceneVariant,
    },
    cases: data.cases.map((item, index) => ({
      ...item,
      badge: stepBadges[index] ?? item.badge,
      variant: sceneVariant,
    })) as unknown as TradingSignalData["cases"],
    checklist: {
      ...data.checklist,
      variant: sceneVariant,
    },
    close: {
      ...data.close,
      tags: [],
      variant: sceneVariant,
    },
  };
};

export const getTradingSignalDurationFromTimeline = (timeline: TradingSignalTimeline = DEFAULT_TRADING_SIGNAL_TIMELINE) => {
  return Object.values(timeline).reduce((total, value) => total + value, 0);
};

export const TradingSignalComposition: React.FC<TradingSignalCompositionProps> = ({
  backgroundColor = "#04060b",
  timeline = DEFAULT_TRADING_SIGNAL_TIMELINE,
  audio,
  data,
  variant,
}) => {
  const safeData = sanitizeTradingSignalData(data, variant);
  const resolvedData: TradingSignalData = {
    ...safeData,
    newsContext: {
      ...safeData.newsContext,
      mediaCards: safeData.newsContext.mediaCards.map((card) => ({
        ...card,
        imageSrc: toStaticAsset(card.imageSrc) ?? card.imageSrc,
      })),
    },
    hook: {
      ...safeData.hook,
      insetImageSrc: toStaticAsset(safeData.hook.insetImageSrc) ?? safeData.hook.insetImageSrc,
    },
    mechanism: {
      ...safeData.mechanism,
      imageSrc: toStaticAsset(safeData.mechanism.imageSrc) ?? safeData.mechanism.imageSrc,
    },
    cases: safeData.cases.map((item) => ({
      ...item,
      imageSrc: toStaticAsset(item.imageSrc) ?? item.imageSrc,
    })) as unknown as TradingSignalData["cases"],
  };

  const newsFrom = 0;
  const hookFrom = newsFrom + timeline.news;
  const mechanismFrom = hookFrom + timeline.hook;
  const case1From = mechanismFrom + timeline.mechanism;
  const case2From = case1From + timeline.case1;
  const case3From = case2From + timeline.case2;
  const checklistFrom = case3From + timeline.case3;
  const closeFrom = checklistFrom + timeline.checklist;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {audio ? <AudioTrackLayer config={audio} /> : null}
      <Sequence from={newsFrom} durationInFrames={timeline.news}>
        <TradingNewsContextScene {...resolvedData.newsContext} />
      </Sequence>
      <Sequence from={hookFrom} durationInFrames={timeline.hook}>
        <TradingCaseShockScene {...resolvedData.hook} />
      </Sequence>
      <Sequence from={mechanismFrom} durationInFrames={timeline.mechanism}>
        <TradingIndicatorMechanismScene {...resolvedData.mechanism} />
      </Sequence>
      <Sequence from={case1From} durationInFrames={timeline.case1}>
        <TradingChartCaseScene {...resolvedData.cases[0]} />
      </Sequence>
      <Sequence from={case2From} durationInFrames={timeline.case2}>
        <TradingChartCaseScene {...resolvedData.cases[1]} />
      </Sequence>
      <Sequence from={case3From} durationInFrames={timeline.case3}>
        <TradingChartCaseScene {...resolvedData.cases[2]} />
      </Sequence>
      <Sequence from={checklistFrom} durationInFrames={timeline.checklist}>
        <TradingChecklistScene {...resolvedData.checklist} />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={timeline.close}>
        <TradingRiskCloseScene {...resolvedData.close} />
      </Sequence>
      <SubtitleTrack cues={audio?.subtitles ?? []} fontSize={audio?.subtitleStyle?.fontSize} color={audio?.subtitleStyle?.color} />
    </AbsoluteFill>
  );
};
