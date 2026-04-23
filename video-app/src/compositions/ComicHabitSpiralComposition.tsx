import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { comicHabitSpiralAudio } from "../data/comicHabitSpiralAudio";
import { comicHabitSpiralData } from "../data/comicHabitSpiralData";
import { ComicCloseScene } from "../scenes/comic/ComicCloseScene";
import { ComicMechanismScene } from "../scenes/comic/ComicMechanismScene";
import { ComicSplitHookScene } from "../scenes/comic/ComicSplitHookScene";
import { ComicStoryScene } from "../scenes/comic/ComicStoryScene";
import { ComicTriptychScene } from "../scenes/comic/ComicTriptychScene";

const TIMELINE = {
  hook: 180,
  storyA: 240,
  mechanism: 270,
  storyB: 240,
  storyC: 240,
  triptych: 300,
  close: 330,
} as const;

export const ComicHabitSpiralComposition: React.FC = () => {
  const hookFrom = 0;
  const storyAFrom = hookFrom + TIMELINE.hook;
  const mechanismFrom = storyAFrom + TIMELINE.storyA;
  const storyBFrom = mechanismFrom + TIMELINE.mechanism;
  const storyCFrom = storyBFrom + TIMELINE.storyB;
  const triptychFrom = storyCFrom + TIMELINE.storyC;
  const closeFrom = triptychFrom + TIMELINE.triptych;

  return (
    <AbsoluteFill style={{ backgroundColor: "#101424" }}>
      <AudioTrackLayer config={comicHabitSpiralAudio} />
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <ComicSplitHookScene {...comicHabitSpiralData.hook} />
      </Sequence>
      <Sequence from={storyAFrom} durationInFrames={TIMELINE.storyA}>
        <ComicStoryScene {...comicHabitSpiralData.storyA} />
      </Sequence>
      <Sequence from={mechanismFrom} durationInFrames={TIMELINE.mechanism}>
        <ComicMechanismScene {...comicHabitSpiralData.mechanism} />
      </Sequence>
      <Sequence from={storyBFrom} durationInFrames={TIMELINE.storyB}>
        <ComicStoryScene {...comicHabitSpiralData.storyB} />
      </Sequence>
      <Sequence from={storyCFrom} durationInFrames={TIMELINE.storyC}>
        <ComicStoryScene {...comicHabitSpiralData.storyC} />
      </Sequence>
      <Sequence from={triptychFrom} durationInFrames={TIMELINE.triptych}>
        <ComicTriptychScene {...comicHabitSpiralData.triptych} />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <ComicCloseScene {...comicHabitSpiralData.close} />
      </Sequence>
      <SubtitleTrack cues={comicHabitSpiralAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
