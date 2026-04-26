import React from "react";
import { AbsoluteFill } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { stoicBoundaryAudio } from "../data/PhilosophyMontageStoicBoundaryAudio";
import {
  STOIC_BOUNDARY_DURATION,
  stoicBoundaryOpenerConfig,
  stoicBoundaryScenes,
} from "../data/PhilosophyMontageStoicBoundaryData";
import { PhilosophyMontageScenes } from "../scenes/philosophyMontage/PhilosophyMontageScenes";

export const STOIC_BOUNDARY_DURATION_IN_FRAMES = STOIC_BOUNDARY_DURATION;

export const PhilosophyMontageStoicBoundaryComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#030712" }}>
      <PhilosophyMontageScenes scenes={stoicBoundaryScenes} openerConfig={stoicBoundaryOpenerConfig} />
      <AudioTrackLayer config={stoicBoundaryAudio} />
      <SubtitleTrack cues={stoicBoundaryAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
