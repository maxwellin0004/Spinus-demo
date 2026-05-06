import { newSignalsRsiAudio } from "../data/newSignalsRsiAudio";
import { newSignalsRsiData } from "../data/newSignalsRsiData";
import { TradingSignalComposition } from "./TradingSignalComposition";

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
  return (
    <TradingSignalComposition
      backgroundColor="#f6f9ff"
      timeline={TIMELINE}
      audio={newSignalsRsiAudio}
      data={newSignalsRsiData}
      variant={variant}
    />
  );
};
