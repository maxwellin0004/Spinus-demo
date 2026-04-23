import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { minimalPsychExplainerAudio } from "../data/minimalPsychExplainerAudio";
import { minimalPsychExplainerData } from "../data/minimalPsychExplainerData";
import { PsychKeywordReelScene } from "../scenes/psych/PsychKeywordReelScene";
import { PsychMethodScene } from "../scenes/psych/PsychMethodScene";
import { PsychSeriesTitleScene } from "../scenes/psych/PsychSeriesTitleScene";
import { PsychStatementScene } from "../scenes/psych/PsychStatementScene";

const TIMELINE = {
  title: 80,
  reel: 53,
  s1: 159,
  s2: 186,
  s3: 159,
  s4: 159,
  method: 212,
  close: 132,
} as const;

export const MinimalPsychExplainerComposition: React.FC = () => {
  const titleFrom = 0;
  const reelFrom = titleFrom + TIMELINE.title;
  const s1From = reelFrom + TIMELINE.reel;
  const s2From = s1From + TIMELINE.s1;
  const s3From = s2From + TIMELINE.s2;
  const s4From = s3From + TIMELINE.s3;
  const methodFrom = s4From + TIMELINE.s4;
  const closeFrom = methodFrom + TIMELINE.method;

  return (
    <AbsoluteFill style={{ backgroundColor: "#fcfcfb" }}>
      <AudioTrackLayer config={minimalPsychExplainerAudio} />
      <Sequence from={titleFrom} durationInFrames={TIMELINE.title}>
        <PsychSeriesTitleScene {...minimalPsychExplainerData.title} />
      </Sequence>
      <Sequence from={reelFrom} durationInFrames={TIMELINE.reel}>
        <PsychKeywordReelScene words={minimalPsychExplainerData.reelWords} />
      </Sequence>
      <Sequence from={s1From} durationInFrames={TIMELINE.s1}>
        <PsychStatementScene {...minimalPsychExplainerData.scenes[0]} />
      </Sequence>
      <Sequence from={s2From} durationInFrames={TIMELINE.s2}>
        <PsychStatementScene {...minimalPsychExplainerData.scenes[1]} />
      </Sequence>
      <Sequence from={s3From} durationInFrames={TIMELINE.s3}>
        <PsychStatementScene {...minimalPsychExplainerData.scenes[2]} />
      </Sequence>
      <Sequence from={s4From} durationInFrames={TIMELINE.s4}>
        <PsychStatementScene {...minimalPsychExplainerData.scenes[3]} />
      </Sequence>
      <Sequence from={methodFrom} durationInFrames={TIMELINE.method}>
        <PsychMethodScene {...minimalPsychExplainerData.method} />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <PsychStatementScene {...minimalPsychExplainerData.close} />
      </Sequence>
      <SubtitleTrack cues={minimalPsychExplainerAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
