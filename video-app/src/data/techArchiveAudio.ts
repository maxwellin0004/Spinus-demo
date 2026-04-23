import type { AudioLayerConfig } from "../lib/audioTypes";
import { techArchiveSubtitles } from "./techArchiveData";

export const techArchiveAudio: AudioLayerConfig = {
  voiceover: {
    src: "/audio/tech-archive/tech-archive-explainer-elevenlabs.mp3",
    startFrame: 0,
    volume: 1,
    enabled: true,
  },
  bgm: {
    src: "/audio/new-signals/financial-tension-low.mp3",
    startFrame: 0,
    volume: 0.14,
    loop: true,
    enabled: false,
  },
  sfx: [],
  subtitles: techArchiveSubtitles,
};

