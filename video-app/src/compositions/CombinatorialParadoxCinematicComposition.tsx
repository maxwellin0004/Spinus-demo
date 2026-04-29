import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import {
  COMBINATORIAL_PARADOX_DURATION,
  combinatorialParadoxAudioConfig,
  combinatorialParadoxScenes,
  combinatorialParadoxSubtitleCues,
} from "../data/combinatorialParadoxCinematicData";
import {
  MechanismGridScene,
  ParadoxColdOpenScene,
  ProbabilityBoardScene,
  ReflectiveCloseScene,
  RuleTheaterScene,
} from "../scenes/paradoxLab/ProbabilityParadoxLabScenes";

const renderScene = (scene: (typeof combinatorialParadoxScenes)[number]) => {
  switch (scene.type) {
    case "ParadoxColdOpenScene":
      return <ParadoxColdOpenScene scene={scene} />;
    case "RuleTheaterScene":
      return <RuleTheaterScene scene={scene} />;
    case "MechanismGridScene":
      return <MechanismGridScene scene={scene} />;
    case "ProbabilityBoardScene":
      return <ProbabilityBoardScene scene={scene} />;
    case "ReflectiveCloseScene":
      return <ReflectiveCloseScene scene={scene} />;
    default:
      return null;
  }
};

export { COMBINATORIAL_PARADOX_DURATION };

export const CombinatorialParadoxCinematicComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#efe4c8" }}>
      {combinatorialParadoxScenes.map((scene) => (
        <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationInFrames}>
          {renderScene(scene)}
        </Sequence>
      ))}
      <AudioTrackLayer config={combinatorialParadoxAudioConfig} />
      <SubtitleTrack cues={combinatorialParadoxSubtitleCues} />
    </AbsoluteFill>
  );
};
