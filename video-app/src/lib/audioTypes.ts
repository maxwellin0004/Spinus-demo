export type SubtitleCue = {
  startFrame: number;
  endFrame: number;
  text: string;
  emphasisWords?: string[];
};

export type AudioClip = {
  src: string;
  startFrame: number;
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
  trimBefore?: number;
  trimAfter?: number;
  enabled?: boolean;
};

export type DuckingRule = {
  target: "bgm" | "sfx";
  when: string;
  gain: number;
};

export type AudioLayerConfig = {
  voiceover?: AudioClip | null;
  bgm?: AudioClip | null;
  sfx?: AudioClip[];
  duckingRules?: DuckingRule[];
  subtitles?: SubtitleCue[];
};
