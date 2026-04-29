import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { sleepPostureTaxonomyAudio } from "../data/sleepPostureTaxonomyAudio";
import {
  sleepPostureTaxonomyData,
  SLEEP_POSTURE_TAXONOMY_DURATION_IN_FRAMES,
} from "../data/sleepPostureTaxonomyData";
import {
  CaptionRevealScene,
  PostureStripScene,
  ResultPromptScene,
  TaxonomyOpenerScene,
} from "../scenes/sleepPostureTaxonomy/SleepPostureTaxonomyScenes";

export { SLEEP_POSTURE_TAXONOMY_DURATION_IN_FRAMES };

const sceneComponents = {
  TaxonomyOpenerScene,
  PostureStripScene,
  CaptionRevealScene,
  ResultPromptScene,
} as const;

export const SleepPostureTaxonomyComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <AudioTrackLayer config={sleepPostureTaxonomyAudio} />
      {sleepPostureTaxonomyData.timeline.map((segment) => {
        const Scene = sceneComponents[segment.sceneType];
        return (
          <Sequence
            key={segment.id}
            from={segment.startFrame}
            durationInFrames={segment.endFrame - segment.startFrame + 1}
          >
            <Scene header={sleepPostureTaxonomyData.header} items={sleepPostureTaxonomyData.items} segment={segment} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
