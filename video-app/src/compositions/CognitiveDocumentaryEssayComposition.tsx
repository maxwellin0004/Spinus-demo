import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import {
  COGNITIVE_DOC_FPS,
  cognitiveDocumentaryScenes,
} from "../data/cognitiveDocumentaryEssayData";
import { cognitiveDocumentaryAlignedAudio } from "../data/cognitiveDocumentaryEssayAudio";
import { CognitiveDocumentaryScene } from "../scenes/cognitiveDocumentary/CognitiveDocumentaryScenes";

export const CognitiveDocumentaryEssayComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050403" }}>
      {cognitiveDocumentaryScenes.map((scene) => (
        <Sequence
          key={scene.sceneId}
          from={Math.round(scene.startSec * COGNITIVE_DOC_FPS)}
          durationInFrames={Math.round(scene.durationSec * COGNITIVE_DOC_FPS)}
        >
          <CognitiveDocumentaryScene scene={scene} />
        </Sequence>
      ))}
      <AudioTrackLayer config={cognitiveDocumentaryAlignedAudio} />
      <SubtitleTrack cues={cognitiveDocumentaryAlignedAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
