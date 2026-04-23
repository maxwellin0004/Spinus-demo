import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { mcpVerticalAudio } from "../data/mcpVerticalAudio";
import { ImpactHookScene } from "../scenes/hook/ImpactHookScene";
import { DefinitionScene } from "../scenes/explain/DefinitionScene";
import { CloseStatementScene } from "../scenes/close/CloseStatementScene";
import { mcpVerticalSample } from "../data/mcpVerticalSample";

export const McpVerticalComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#050816" }}>
      <AudioTrackLayer config={mcpVerticalAudio} />
      <Sequence durationInFrames={75}>
        <ImpactHookScene
          eyebrow={mcpVerticalSample.hook.eyebrow}
          headline={mcpVerticalSample.hook.headline}
          supportingText={mcpVerticalSample.hook.supportingText}
          accentWords={mcpVerticalSample.hook.accentWords}
        />
      </Sequence>
      <Sequence from={75} durationInFrames={150}>
        <DefinitionScene
          term={mcpVerticalSample.definition.term}
          definition={mcpVerticalSample.definition.definition}
          bullets={mcpVerticalSample.definition.bullets}
        />
      </Sequence>
      <Sequence from={225} durationInFrames={90}>
        <CloseStatementScene
          headline={mcpVerticalSample.close.headline}
          subheadline={mcpVerticalSample.close.subheadline}
        />
      </Sequence>
      <SubtitleTrack cues={mcpVerticalAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
