import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import type { AudioClip, AudioLayerConfig } from "../../lib/audioTypes";

const renderClip = (clip: AudioClip, key: string) => {
  if (!clip.enabled || !clip.src) {
    return null;
  }

  return (
    <Sequence key={key} from={clip.startFrame}>
      <Audio
        src={staticFile(clip.src.replace(/^\/+/, ""))}
        volume={() => clip.volume ?? 1}
        playbackRate={clip.playbackRate ?? 1}
        {...(clip.loop ? { loop: true } : {})}
        {...(clip.trimBefore ? { trimBefore: clip.trimBefore } : {})}
        {...(clip.trimAfter ? { trimAfter: clip.trimAfter } : {})}
      />
    </Sequence>
  );
};

type AudioTrackLayerProps = {
  config: AudioLayerConfig;
};

export const AudioTrackLayer: React.FC<AudioTrackLayerProps> = ({ config }) => {
  return (
    <>
      {config.voiceover ? renderClip(config.voiceover, "voiceover") : null}
      {config.bgm ? renderClip(config.bgm, "bgm") : null}
      {config.sfx?.map((clip, index) => renderClip(clip, `sfx-${index}`))}
    </>
  );
};
