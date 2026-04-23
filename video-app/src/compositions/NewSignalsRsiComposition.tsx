import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { newSignalsRsiAudio } from "../data/newSignalsRsiAudio";
import { newSignalsRsiData } from "../data/newSignalsRsiData";
import { TradingCaseShockScene } from "../scenes/trading/TradingCaseShockScene";
import { TradingChartCaseScene } from "../scenes/trading/TradingChartCaseScene";
import { TradingChecklistScene } from "../scenes/trading/TradingChecklistScene";
import { TradingIndicatorMechanismScene } from "../scenes/trading/TradingIndicatorMechanismScene";
import { TradingNewsContextScene } from "../scenes/trading/TradingNewsContextScene";
import { TradingRiskCloseScene } from "../scenes/trading/TradingRiskCloseScene";

const TIMELINE = {
  news: 180,
  hook: 180,
  mechanism: 240,
  case1: 150,
  case2: 150,
  case3: 150,
  checklist: 240,
  close: 510,
} as const;

export const NewSignalsRsiComposition: React.FC = () => {
  const variant = newSignalsRsiData.variant;
  const newsFrom = 0;
  const hookFrom = newsFrom + TIMELINE.news;
  const mechanismFrom = hookFrom + TIMELINE.hook;
  const case1From = mechanismFrom + TIMELINE.mechanism;
  const case2From = case1From + TIMELINE.case1;
  const case3From = case2From + TIMELINE.case2;
  const checklistFrom = case3From + TIMELINE.case3;
  const closeFrom = checklistFrom + TIMELINE.checklist;

  return (
    <AbsoluteFill style={{ backgroundColor: "#f6f9ff" }}>
      <AudioTrackLayer config={newSignalsRsiAudio} />
      <Sequence from={newsFrom} durationInFrames={TIMELINE.news}>
        <TradingNewsContextScene {...newSignalsRsiData.newsContext} variant={variant} />
      </Sequence>
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <TradingCaseShockScene {...newSignalsRsiData.hook} variant={variant} />
      </Sequence>
      <Sequence from={mechanismFrom} durationInFrames={TIMELINE.mechanism}>
        <TradingIndicatorMechanismScene {...newSignalsRsiData.mechanism} variant={variant} />
      </Sequence>
      <Sequence from={case1From} durationInFrames={TIMELINE.case1}>
        <TradingChartCaseScene {...newSignalsRsiData.cases[0]} variant={variant} />
      </Sequence>
      <Sequence from={case2From} durationInFrames={TIMELINE.case2}>
        <TradingChartCaseScene {...newSignalsRsiData.cases[1]} variant={variant} />
      </Sequence>
      <Sequence from={case3From} durationInFrames={TIMELINE.case3}>
        <TradingChartCaseScene {...newSignalsRsiData.cases[2]} variant={variant} />
      </Sequence>
      <Sequence from={checklistFrom} durationInFrames={TIMELINE.checklist}>
        <TradingChecklistScene {...newSignalsRsiData.checklist} variant={variant} />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <TradingRiskCloseScene {...newSignalsRsiData.close} variant={variant} />
      </Sequence>
      <SubtitleTrack cues={newSignalsRsiAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
