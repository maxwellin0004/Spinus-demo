import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { newSignalsAudio } from "../data/newSignalsAudio";
import { newSignalsData } from "../data/newSignalsData";
import type { AudioLayerConfig } from "../lib/audioTypes";
import { TradingCaseShockScene } from "../scenes/trading/TradingCaseShockScene";
import { TradingChartCaseScene } from "../scenes/trading/TradingChartCaseScene";
import { TradingChecklistScene } from "../scenes/trading/TradingChecklistScene";
import { TradingIndicatorMechanismScene } from "../scenes/trading/TradingIndicatorMechanismScene";
import { TradingNewsContextScene } from "../scenes/trading/TradingNewsContextScene";
import { TradingRiskCloseScene } from "../scenes/trading/TradingRiskCloseScene";

export const DEFAULT_CODEX_JOB_TIMELINE = {
  news: 240,
  hook: 240,
  mechanism: 300,
  case1: 210,
  case2: 210,
  case3: 210,
  checklist: 330,
  close: 510,
} as const;

export type CodexJobProps = {
  backgroundColor?: string;
  timeline?: typeof DEFAULT_CODEX_JOB_TIMELINE;
  audio?: AudioLayerConfig;
  data: {
    newsContext: React.ComponentProps<typeof TradingNewsContextScene>;
    hook: React.ComponentProps<typeof TradingCaseShockScene>;
    mechanism: React.ComponentProps<typeof TradingIndicatorMechanismScene>;
    cases: [
      React.ComponentProps<typeof TradingChartCaseScene>,
      React.ComponentProps<typeof TradingChartCaseScene>,
      React.ComponentProps<typeof TradingChartCaseScene>,
    ];
    checklist: React.ComponentProps<typeof TradingChecklistScene>;
    close: React.ComponentProps<typeof TradingRiskCloseScene>;
  };
};

export const defaultCodexJobProps: CodexJobProps = {
  backgroundColor: "#04060b",
  timeline: DEFAULT_CODEX_JOB_TIMELINE,
  audio: newSignalsAudio,
  data: newSignalsData,
};

export const getCodexJobDurationFromProps = (props: CodexJobProps) => {
  const timeline = props.timeline ?? DEFAULT_CODEX_JOB_TIMELINE;
  return Object.values(timeline).reduce((total, value) => total + value, 0);
};

export const CodexJobComposition: React.FC<CodexJobProps> = (props) => {
  const timeline = props.timeline ?? DEFAULT_CODEX_JOB_TIMELINE;
  const audio = props.audio ?? newSignalsAudio;
  const toStaticAsset = (src?: string) => {
    if (!src) return src;
    if (/^https?:\/\//.test(src)) return src;
    return staticFile(src.replace(/^\/+/, ""));
  };
  const normalizedData: CodexJobProps["data"] = {
    newsContext: {
      ...props.data.newsContext,
      mediaCards: props.data.newsContext.mediaCards.map((card) => ({
        ...card,
        imageSrc: toStaticAsset(card.imageSrc) ?? card.imageSrc,
      })),
    },
    hook: {
      ...props.data.hook,
      insetImageSrc: toStaticAsset(props.data.hook.insetImageSrc) ?? props.data.hook.insetImageSrc,
    },
    mechanism: {
      ...props.data.mechanism,
      imageSrc: toStaticAsset(props.data.mechanism.imageSrc) ?? props.data.mechanism.imageSrc,
    },
    cases: props.data.cases.map((item) => ({
      ...item,
      imageSrc: toStaticAsset(item.imageSrc) ?? item.imageSrc,
    })) as CodexJobProps["data"]["cases"],
    checklist: props.data.checklist,
    close: props.data.close,
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
    <AbsoluteFill style={{ backgroundColor: props.backgroundColor ?? "#04060b" }}>
      <AudioTrackLayer config={audio} />
      <Sequence from={newsFrom} durationInFrames={timeline.news}>
        <TradingNewsContextScene {...normalizedData.newsContext} />
      </Sequence>
      <Sequence from={hookFrom} durationInFrames={timeline.hook}>
        <TradingCaseShockScene {...normalizedData.hook} />
      </Sequence>
      <Sequence from={mechanismFrom} durationInFrames={timeline.mechanism}>
        <TradingIndicatorMechanismScene {...normalizedData.mechanism} />
      </Sequence>
      <Sequence from={case1From} durationInFrames={timeline.case1}>
        <TradingChartCaseScene {...normalizedData.cases[0]} />
      </Sequence>
      <Sequence from={case2From} durationInFrames={timeline.case2}>
        <TradingChartCaseScene {...normalizedData.cases[1]} />
      </Sequence>
      <Sequence from={case3From} durationInFrames={timeline.case3}>
        <TradingChartCaseScene {...normalizedData.cases[2]} />
      </Sequence>
      <Sequence from={checklistFrom} durationInFrames={timeline.checklist}>
        <TradingChecklistScene {...normalizedData.checklist} />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={timeline.close}>
        <TradingRiskCloseScene {...normalizedData.close} />
      </Sequence>
      <SubtitleTrack cues={audio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
