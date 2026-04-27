import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import {
  corporateRetreatDossierScenes,
  corporateRetreatDossierSubtitles,
} from "../data/corporateRetreatDossierData";
import { DossierSceneView } from "../scenes/corporateRetreatDossier/DossierScenes";

export const CorporateRetreatDossierComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#11161b" }}>
      <Audio src={staticFile("audio/corporate-retreat-dossier/documentary-pulse.wav")} volume={0.055} />
      <Audio src={staticFile("audio/corporate-retreat-dossier/elevenlabs-voiceover.mp3")} volume={1} />
      {corporateRetreatDossierScenes.map((scene) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}>
          <DossierSceneView scene={scene} />
        </Sequence>
      ))}
      <SubtitleTrack cues={corporateRetreatDossierSubtitles} />
    </AbsoluteFill>
  );
};
