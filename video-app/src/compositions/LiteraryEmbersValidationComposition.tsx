import React from "react";
import { AbsoluteFill } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { BilingualQuoteTrack } from "../components/video/BilingualQuoteTrack";
import { literaryEmbersAudio, literaryEmbersSubtitleCues } from "../data/LiteraryEmbersValidationAudio";
import { LITERARY_EMBERS_DURATION_IN_FRAMES } from "../data/LiteraryEmbersValidationData";
import { LiteraryEmbersScenes } from "../scenes/literaryEmbers/LiteraryEmbersScenes";

export const LITERARY_EMBERS_VERTICAL_DURATION_IN_FRAMES = LITERARY_EMBERS_DURATION_IN_FRAMES;

export const LiteraryEmbersValidationComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      <LiteraryEmbersScenes />
      <AudioTrackLayer config={literaryEmbersAudio} />
      <BilingualQuoteTrack cues={literaryEmbersSubtitleCues} />
    </AbsoluteFill>
  );
};
