import type { CalculateMetadataFunction } from "remotion";
import { newSignalsAudio } from "../data/newSignalsAudio";
import { newSignalsData } from "../data/newSignalsData";
import {
  DEFAULT_TRADING_SIGNAL_TIMELINE,
  getTradingSignalDurationFromTimeline,
  TradingSignalComposition,
  type TradingSignalCompositionProps,
} from "./TradingSignalComposition";

export const DEFAULT_CODEX_JOB_TIMELINE = DEFAULT_TRADING_SIGNAL_TIMELINE;

export type CodexJobProps = TradingSignalCompositionProps;

export const defaultCodexJobProps: CodexJobProps = {
  backgroundColor: "#04060b",
  timeline: DEFAULT_CODEX_JOB_TIMELINE,
  audio: newSignalsAudio,
  data: newSignalsData,
};

export const getCodexJobDurationFromProps = (props: CodexJobProps) => {
  return getTradingSignalDurationFromTimeline(props.timeline ?? DEFAULT_CODEX_JOB_TIMELINE);
};

export const calculateCodexJobMetadata: CalculateMetadataFunction<CodexJobProps> = ({ props }) => {
  return {
    durationInFrames: getCodexJobDurationFromProps(props),
  };
};

export const CodexJobComposition: React.FC<CodexJobProps> = (props) => {
  return <TradingSignalComposition {...props} audio={props.audio ?? newSignalsAudio} />;
};
