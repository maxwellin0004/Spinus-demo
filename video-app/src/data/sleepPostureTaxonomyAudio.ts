import type { AudioLayerConfig } from "../lib/audioTypes";
import { sleepPostureTaxonomyData } from "./sleepPostureTaxonomyData";

export const sleepPostureTaxonomyAudio: AudioLayerConfig = {
  voiceover: {
    src: "audio/sleep-posture-taxonomy/voiceover.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  bgm: {
    src: "audio/sleep-posture-taxonomy/soft-pulse.wav",
    startFrame: 0,
    volume: 0.08,
    loop: false,
    enabled: true,
  },
  sfx: [],
  duckingRules: [
    {
      target: "bgm",
      when: "voiceover_active",
      gain: 0.35,
    },
  ],
  subtitles: sleepPostureTaxonomyData.timeline.map((segment) => ({
    startFrame: segment.startFrame,
    endFrame: segment.endFrame,
    text: segment.caption,
    emphasisWords: [],
  })),
};
