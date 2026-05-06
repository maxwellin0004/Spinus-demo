import { newSignalsAudio } from "../data/newSignalsAudio";
import { newSignalsData } from "../data/newSignalsData";
import { TradingSignalComposition } from "./TradingSignalComposition";

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
  return <TradingSignalComposition backgroundColor="#04060b" timeline={TIMELINE} audio={newSignalsAudio} data={newSignalsData} />;
};
