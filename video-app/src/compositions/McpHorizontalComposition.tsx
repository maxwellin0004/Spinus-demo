import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { mcpReferenceCloneAudio } from "../data/mcpReferenceCloneAudio";
import { mcpReferenceCloneData } from "../data/mcpReferenceCloneData";
import { ReferenceCloseScene } from "../scenes/reference/ReferenceCloseScene";
import { ReferenceCompareScene } from "../scenes/reference/ReferenceCompareScene";
import { ReferenceDocScene } from "../scenes/reference/ReferenceDocScene";
import { ReferenceFlowScene } from "../scenes/reference/ReferenceFlowScene";
import { ReferenceHookScene } from "../scenes/reference/ReferenceHookScene";
import { ReferenceScenarioScene } from "../scenes/reference/ReferenceScenarioScene";

const TIMELINE = {
  hook: 180,
  doc: 300,
  compare: 270,
  scenario1: 180,
  scenario2: 180,
  scenario3: 180,
  flow: 180,
  skillCompare: 210,
  close: 270,
} as const;

export const McpHorizontalComposition: React.FC = () => {
  const hookFrom = 0;
  const docFrom = hookFrom + TIMELINE.hook;
  const compareFrom = docFrom + TIMELINE.doc;
  const scenario1From = compareFrom + TIMELINE.compare;
  const scenario2From = scenario1From + TIMELINE.scenario1;
  const scenario3From = scenario2From + TIMELINE.scenario2;
  const flowFrom = scenario3From + TIMELINE.scenario3;
  const skillCompareFrom = flowFrom + TIMELINE.flow;
  const closeFrom = skillCompareFrom + TIMELINE.skillCompare;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050816" }}>
      <AudioTrackLayer config={mcpReferenceCloneAudio} />
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <ReferenceHookScene frames={mcpReferenceCloneData.hookFrames} />
      </Sequence>
      <Sequence from={docFrom} durationInFrames={TIMELINE.doc}>
        <ReferenceDocScene
          path={mcpReferenceCloneData.docScene.path}
          filename={mcpReferenceCloneData.docScene.filename}
          headline={mcpReferenceCloneData.docScene.headline}
          cards={mcpReferenceCloneData.docScene.cards}
        />
      </Sequence>
      <Sequence from={compareFrom} durationInFrames={TIMELINE.compare}>
        <ReferenceCompareScene
          leftTitle={mcpReferenceCloneData.compareScene.leftTitle}
          rightTitle={mcpReferenceCloneData.compareScene.rightTitle}
          leftPoints={mcpReferenceCloneData.compareScene.leftPoints}
          rightPoints={mcpReferenceCloneData.compareScene.rightPoints}
          footer={mcpReferenceCloneData.compareScene.footer}
        />
      </Sequence>
      <Sequence from={scenario1From} durationInFrames={TIMELINE.scenario1}>
        <ReferenceScenarioScene
          badge={mcpReferenceCloneData.scenarios[0].badge}
          title={mcpReferenceCloneData.scenarios[0].title}
          description={mcpReferenceCloneData.scenarios[0].description}
          bullets={mcpReferenceCloneData.scenarios[0].bullets}
          imageSrc={mcpReferenceCloneData.scenarios[0].imageSrc}
        />
      </Sequence>
      <Sequence from={scenario2From} durationInFrames={TIMELINE.scenario2}>
        <ReferenceScenarioScene
          badge={mcpReferenceCloneData.scenarios[1].badge}
          title={mcpReferenceCloneData.scenarios[1].title}
          description={mcpReferenceCloneData.scenarios[1].description}
          bullets={mcpReferenceCloneData.scenarios[1].bullets}
          imageSrc={mcpReferenceCloneData.scenarios[1].imageSrc}
        />
      </Sequence>
      <Sequence from={scenario3From} durationInFrames={TIMELINE.scenario3}>
        <ReferenceScenarioScene
          badge={mcpReferenceCloneData.scenarios[2].badge}
          title={mcpReferenceCloneData.scenarios[2].title}
          description={mcpReferenceCloneData.scenarios[2].description}
          bullets={mcpReferenceCloneData.scenarios[2].bullets}
          imageSrc={mcpReferenceCloneData.scenarios[2].imageSrc}
        />
      </Sequence>
      <Sequence from={flowFrom} durationInFrames={TIMELINE.flow}>
        <ReferenceFlowScene
          title={mcpReferenceCloneData.flowScene.title}
          steps={mcpReferenceCloneData.flowScene.steps}
        />
      </Sequence>
      <Sequence from={skillCompareFrom} durationInFrames={TIMELINE.skillCompare}>
        <ReferenceCompareScene
          title={mcpReferenceCloneData.skillCompare.title}
          leftTitle={mcpReferenceCloneData.skillCompare.leftLabel}
          rightTitle={mcpReferenceCloneData.skillCompare.rightLabel}
          leftPoints={[mcpReferenceCloneData.skillCompare.leftBody]}
          rightPoints={[mcpReferenceCloneData.skillCompare.rightBody]}
          footer={mcpReferenceCloneData.skillCompare.footer}
        />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <ReferenceCloseScene
          headline={mcpReferenceCloneData.closeScene.headline}
          subheadline={mcpReferenceCloneData.closeScene.subheadline}
        />
      </Sequence>
      <SubtitleTrack cues={mcpReferenceCloneAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
