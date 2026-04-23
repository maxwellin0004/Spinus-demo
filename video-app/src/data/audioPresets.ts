import type { AudioClip, AudioLayerConfig, SubtitleCue } from "../lib/audioTypes";

type VoiceOnlyAudioOptions = {
  voiceoverSrc: string;
  subtitles: SubtitleCue[];
  voiceoverEnabled?: boolean;
  bgmSrc?: string;
  bgmEnabled?: boolean;
  bgmVolume?: number;
  sfx?: AudioClip[];
};

export const createVoiceOnlyAudioConfig = ({
  voiceoverSrc,
  subtitles,
  voiceoverEnabled = false,
  bgmSrc,
  bgmEnabled = false,
  bgmVolume = 0.2,
  sfx = [],
}: VoiceOnlyAudioOptions): AudioLayerConfig => {
  return {
    voiceover: {
      src: voiceoverSrc,
      startFrame: 0,
      volume: 1,
      enabled: voiceoverEnabled,
    },
    bgm: bgmSrc
      ? {
          src: bgmSrc,
          startFrame: 0,
          volume: bgmVolume,
          loop: true,
          enabled: bgmEnabled,
        }
      : null,
    sfx,
    duckingRules: bgmSrc
      ? [
          {
            target: "bgm",
            when: "voiceover_active",
            gain: 0.35,
          },
        ]
      : [],
    subtitles,
  };
};
