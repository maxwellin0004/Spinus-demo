import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { newSignalsVolumeAudio } from "../data/newSignalsVolumeAudio";
import { newSignalsVolumeData } from "../data/newSignalsVolumeData";
import { TradingCaseShockScene } from "../scenes/trading/TradingCaseShockScene";
import { TradingChartCaseScene } from "../scenes/trading/TradingChartCaseScene";
import { TradingChecklistScene } from "../scenes/trading/TradingChecklistScene";
import { TradingIndicatorMechanismScene } from "../scenes/trading/TradingIndicatorMechanismScene";
import { TradingNewsContextScene } from "../scenes/trading/TradingNewsContextScene";
import { TradingRiskCloseScene } from "../scenes/trading/TradingRiskCloseScene";

const TIMELINE = {
  news: 210,
  hook: 210,
  mechanism: 270,
  case1: 180,
  case2: 180,
  case3: 180,
  checklist: 270,
  close: 300,
} as const;

export const NewSignalsVolumeComposition: React.FC = () => {
  const variant = newSignalsVolumeData.variant;
  const newsFrom = 0;
  const hookFrom = newsFrom + TIMELINE.news;
  const mechanismFrom = hookFrom + TIMELINE.hook;
  const case1From = mechanismFrom + TIMELINE.mechanism;
  const case2From = case1From + TIMELINE.case1;
  const case3From = case2From + TIMELINE.case2;
  const checklistFrom = case3From + TIMELINE.case3;
  const closeFrom = checklistFrom + TIMELINE.checklist;

  return (
    <AbsoluteFill style={{ backgroundColor: "#04060b" }}>
      <AudioTrackLayer config={newSignalsVolumeAudio} />
      <Sequence from={newsFrom} durationInFrames={TIMELINE.news}>
        <TradingNewsContextScene {...newSignalsVolumeData.newsContext} variant={variant} />
      </Sequence>
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <TradingCaseShockScene {...newSignalsVolumeData.hook} variant={variant} />
      </Sequence>
      <Sequence from={mechanismFrom} durationInFrames={TIMELINE.mechanism}>
        <TradingIndicatorMechanismScene {...newSignalsVolumeData.mechanism} variant={variant} />
      </Sequence>
      <Sequence from={case1From} durationInFrames={TIMELINE.case1}>
        <TradingChartCaseScene {...newSignalsVolumeData.cases[0]} variant={variant} />
      </Sequence>
      <Sequence from={case2From} durationInFrames={TIMELINE.case2}>
        <TradingChartCaseScene {...newSignalsVolumeData.cases[1]} variant={variant} />
      </Sequence>
      <Sequence from={case3From} durationInFrames={TIMELINE.case3}>
        <TradingChartCaseScene {...newSignalsVolumeData.cases[2]} variant={variant} />
      </Sequence>
      <Sequence from={checklistFrom} durationInFrames={TIMELINE.checklist}>
        <TradingChecklistScene {...newSignalsVolumeData.checklist} variant={variant} />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <TradingRiskCloseScene {...newSignalsVolumeData.close} variant={variant} />
      </Sequence>
      <SubtitleTrack cues={newSignalsVolumeAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
