import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { comicEmotionalScrollAudio } from "../data/comicEmotionalScrollAudio";
import { comicEmotionalScrollData } from "../data/comicEmotionalScrollData";
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

export const ComicEmotionalScrollComposition: React.FC = () => {
  const hookFrom = 0;
  const storyAFrom = hookFrom + TIMELINE.hook;
  const mechanismFrom = storyAFrom + TIMELINE.storyA;
  const storyBFrom = mechanismFrom + TIMELINE.mechanism;
  const storyCFrom = storyBFrom + TIMELINE.storyB;
  const triptychFrom = storyCFrom + TIMELINE.storyC;
  const closeFrom = triptychFrom + TIMELINE.triptych;

  return (
    <AbsoluteFill style={{ backgroundColor: "#101424" }}>
      <AudioTrackLayer config={comicEmotionalScrollAudio} />
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <ComicSplitHookScene {...comicEmotionalScrollData.hook} />
      </Sequence>
      <Sequence from={storyAFrom} durationInFrames={TIMELINE.storyA}>
        <ComicStoryScene {...comicEmotionalScrollData.storyA} />
      </Sequence>
      <Sequence from={mechanismFrom} durationInFrames={TIMELINE.mechanism}>
        <ComicMechanismScene {...comicEmotionalScrollData.mechanism} />
      </Sequence>
      <Sequence from={storyBFrom} durationInFrames={TIMELINE.storyB}>
        <ComicStoryScene {...comicEmotionalScrollData.storyB} />
      </Sequence>
      <Sequence from={storyCFrom} durationInFrames={TIMELINE.storyC}>
        <ComicStoryScene {...comicEmotionalScrollData.storyC} />
      </Sequence>
      <Sequence from={triptychFrom} durationInFrames={TIMELINE.triptych}>
        <ComicTriptychScene {...comicEmotionalScrollData.triptych} />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <ComicCloseScene {...comicEmotionalScrollData.close} />
      </Sequence>
      <SubtitleTrack cues={comicEmotionalScrollAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
