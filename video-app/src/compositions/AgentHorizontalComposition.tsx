import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { agentReferenceCloneAudio } from "../data/agentReferenceCloneAudio";
import { agentReferenceCloneData } from "../data/agentReferenceCloneData";
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
  conceptCompare: 270,
  close: 360,
} as const;

export const AgentHorizontalComposition: React.FC = () => {
  const palette = agentReferenceCloneData.palette;
  const hookFrom = 0;
  const docFrom = hookFrom + TIMELINE.hook;
  const compareFrom = docFrom + TIMELINE.doc;
  const scenario1From = compareFrom + TIMELINE.compare;
  const scenario2From = scenario1From + TIMELINE.scenario1;
  const scenario3From = scenario2From + TIMELINE.scenario2;
  const flowFrom = scenario3From + TIMELINE.scenario3;
  const conceptCompareFrom = flowFrom + TIMELINE.flow;
  const closeFrom = conceptCompareFrom + TIMELINE.conceptCompare;

  return (
    <AbsoluteFill style={{ backgroundColor: "#07111f" }}>
      <AudioTrackLayer config={agentReferenceCloneAudio} />
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <ReferenceHookScene
          frames={agentReferenceCloneData.hookFrames}
          palette={palette}
        />
      </Sequence>
      <Sequence from={docFrom} durationInFrames={TIMELINE.doc}>
        <ReferenceDocScene
          path={agentReferenceCloneData.docScene.path}
          filename={agentReferenceCloneData.docScene.filename}
          headline={agentReferenceCloneData.docScene.headline}
          cards={agentReferenceCloneData.docScene.cards}
          palette={palette}
        />
      </Sequence>
      <Sequence from={compareFrom} durationInFrames={TIMELINE.compare}>
        <ReferenceCompareScene
          leftTitle={agentReferenceCloneData.compareScene.leftTitle}
          rightTitle={agentReferenceCloneData.compareScene.rightTitle}
          leftPoints={agentReferenceCloneData.compareScene.leftPoints}
          rightPoints={agentReferenceCloneData.compareScene.rightPoints}
          footer={agentReferenceCloneData.compareScene.footer}
          palette={palette}
        />
      </Sequence>
      <Sequence from={scenario1From} durationInFrames={TIMELINE.scenario1}>
        <ReferenceScenarioScene
          badge={agentReferenceCloneData.scenarios[0].badge}
          title={agentReferenceCloneData.scenarios[0].title}
          description={agentReferenceCloneData.scenarios[0].description}
          bullets={agentReferenceCloneData.scenarios[0].bullets}
          imageSrc={agentReferenceCloneData.scenarios[0].imageSrc}
          palette={palette}
        />
      </Sequence>
      <Sequence from={scenario2From} durationInFrames={TIMELINE.scenario2}>
        <ReferenceScenarioScene
          badge={agentReferenceCloneData.scenarios[1].badge}
          title={agentReferenceCloneData.scenarios[1].title}
          description={agentReferenceCloneData.scenarios[1].description}
          bullets={agentReferenceCloneData.scenarios[1].bullets}
          imageSrc={agentReferenceCloneData.scenarios[1].imageSrc}
          palette={palette}
        />
      </Sequence>
      <Sequence from={scenario3From} durationInFrames={TIMELINE.scenario3}>
        <ReferenceScenarioScene
          badge={agentReferenceCloneData.scenarios[2].badge}
          title={agentReferenceCloneData.scenarios[2].title}
          description={agentReferenceCloneData.scenarios[2].description}
          bullets={agentReferenceCloneData.scenarios[2].bullets}
          imageSrc={agentReferenceCloneData.scenarios[2].imageSrc}
          palette={palette}
        />
      </Sequence>
      <Sequence from={flowFrom} durationInFrames={TIMELINE.flow}>
        <ReferenceFlowScene
          title={agentReferenceCloneData.flowScene.title}
          steps={agentReferenceCloneData.flowScene.steps}
          palette={palette}
        />
      </Sequence>
      <Sequence from={conceptCompareFrom} durationInFrames={TIMELINE.conceptCompare}>
        <ReferenceCompareScene
          title={agentReferenceCloneData.conceptCompare.title}
          leftTitle={agentReferenceCloneData.conceptCompare.leftLabel}
          rightTitle={agentReferenceCloneData.conceptCompare.rightLabel}
          leftPoints={[agentReferenceCloneData.conceptCompare.leftBody]}
          rightPoints={[agentReferenceCloneData.conceptCompare.rightBody]}
          footer={agentReferenceCloneData.conceptCompare.footer}
          palette={palette}
        />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <ReferenceCloseScene
          headline={agentReferenceCloneData.closeScene.headline}
          subheadline={agentReferenceCloneData.closeScene.subheadline}
          palette={palette}
        />
      </Sequence>
      <SubtitleTrack cues={agentReferenceCloneAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
