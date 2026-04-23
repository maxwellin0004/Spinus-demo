import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { newSignalsAudio } from "../data/newSignalsAudio";
import { newSignalsData } from "../data/newSignalsData";
import { TradingCaseShockScene } from "../scenes/trading/TradingCaseShockScene";
import { TradingChartCaseScene } from "../scenes/trading/TradingChartCaseScene";
import { TradingChecklistScene } from "../scenes/trading/TradingChecklistScene";
import { TradingIndicatorMechanismScene } from "../scenes/trading/TradingIndicatorMechanismScene";
import { TradingNewsContextScene } from "../scenes/trading/TradingNewsContextScene";
import { TradingRiskCloseScene } from "../scenes/trading/TradingRiskCloseScene";

const TIMELINE = {
  news: 240,
  hook: 240,
  mechanism: 300,
  case1: 210,
  case2: 210,
  case3: 210,
  checklist: 330,
  close: 510,
} as const;

export const NewSignalsComposition: React.FC = () => {
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
      <AudioTrackLayer config={newSignalsAudio} />
      <Sequence from={newsFrom} durationInFrames={TIMELINE.news}>
        <TradingNewsContextScene {...newSignalsData.newsContext} />
      </Sequence>
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <TradingCaseShockScene {...newSignalsData.hook} />
      </Sequence>
      <Sequence from={mechanismFrom} durationInFrames={TIMELINE.mechanism}>
        <TradingIndicatorMechanismScene {...newSignalsData.mechanism} />
      </Sequence>
      <Sequence from={case1From} durationInFrames={TIMELINE.case1}>
        <TradingChartCaseScene {...newSignalsData.cases[0]} />
      </Sequence>
      <Sequence from={case2From} durationInFrames={TIMELINE.case2}>
        <TradingChartCaseScene {...newSignalsData.cases[1]} />
      </Sequence>
      <Sequence from={case3From} durationInFrames={TIMELINE.case3}>
        <TradingChartCaseScene {...newSignalsData.cases[2]} />
      </Sequence>
      <Sequence from={checklistFrom} durationInFrames={TIMELINE.checklist}>
        <TradingChecklistScene {...newSignalsData.checklist} />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <TradingRiskCloseScene {...newSignalsData.close} />
      </Sequence>
      <SubtitleTrack cues={newSignalsAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
