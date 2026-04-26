import React from "react";
import { AbsoluteFill } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { philosophyMontageAudio } from "../data/philosophyMontageAudio";
import { PhilosophyMontageScenes } from "../scenes/philosophyMontage/PhilosophyMontageScenes";
import { PHILOSOPHY_MONTAGE_DURATION } from "../data/PhilosophyMontageValidationData";

export const PHILOSOPHY_MONTAGE_DURATION_IN_FRAMES = PHILOSOPHY_MONTAGE_DURATION;

export const PhilosophyMontageValidationComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#030712" }}>
      <PhilosophyMontageScenes />
      <AudioTrackLayer config={philosophyMontageAudio} />
      <SubtitleTrack cues={philosophyMontageAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
