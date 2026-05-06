import { newSignalsVolumeAudio } from "../data/newSignalsVolumeAudio";
import { newSignalsVolumeData } from "../data/newSignalsVolumeData";
import { TradingSignalComposition } from "./TradingSignalComposition";

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
  return (
    <TradingSignalComposition
      backgroundColor="#04060b"
      timeline={TIMELINE}
      audio={newSignalsVolumeAudio}
      data={newSignalsVolumeData}
      variant={variant}
    />
  );
};
