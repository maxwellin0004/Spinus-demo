import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { skillReferenceCloneAudio } from "../data/skillReferenceCloneAudio";
import { skillReferenceCloneData } from "../data/skillReferenceCloneData";
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
  mcpCompare: 210,
  close: 270,
} as const;

export const SkillHorizontalComposition: React.FC = () => {
  const hookFrom = 0;
  const docFrom = hookFrom + TIMELINE.hook;
  const compareFrom = docFrom + TIMELINE.doc;
  const scenario1From = compareFrom + TIMELINE.compare;
  const scenario2From = scenario1From + TIMELINE.scenario1;
  const scenario3From = scenario2From + TIMELINE.scenario2;
  const flowFrom = scenario3From + TIMELINE.scenario3;
  const mcpCompareFrom = flowFrom + TIMELINE.flow;
  const closeFrom = mcpCompareFrom + TIMELINE.mcpCompare;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050816" }}>
      <AudioTrackLayer config={skillReferenceCloneAudio} />
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <ReferenceHookScene frames={skillReferenceCloneData.hookFrames} />
      </Sequence>
      <Sequence from={docFrom} durationInFrames={TIMELINE.doc}>
        <ReferenceDocScene
          path={skillReferenceCloneData.docScene.path}
          filename={skillReferenceCloneData.docScene.filename}
          headline={skillReferenceCloneData.docScene.headline}
          cards={skillReferenceCloneData.docScene.cards}
        />
      </Sequence>
      <Sequence from={compareFrom} durationInFrames={TIMELINE.compare}>
        <ReferenceCompareScene
          leftTitle={skillReferenceCloneData.compareScene.leftTitle}
          rightTitle={skillReferenceCloneData.compareScene.rightTitle}
          leftPoints={skillReferenceCloneData.compareScene.leftPoints}
          rightPoints={skillReferenceCloneData.compareScene.rightPoints}
          footer={skillReferenceCloneData.compareScene.footer}
        />
      </Sequence>
      <Sequence from={scenario1From} durationInFrames={TIMELINE.scenario1}>
        <ReferenceScenarioScene
          badge={skillReferenceCloneData.scenarios[0].badge}
          title={skillReferenceCloneData.scenarios[0].title}
          description={skillReferenceCloneData.scenarios[0].description}
          bullets={skillReferenceCloneData.scenarios[0].bullets}
          imageSrc={skillReferenceCloneData.scenarios[0].imageSrc}
        />
      </Sequence>
      <Sequence from={scenario2From} durationInFrames={TIMELINE.scenario2}>
        <ReferenceScenarioScene
          badge={skillReferenceCloneData.scenarios[1].badge}
          title={skillReferenceCloneData.scenarios[1].title}
          description={skillReferenceCloneData.scenarios[1].description}
          bullets={skillReferenceCloneData.scenarios[1].bullets}
          imageSrc={skillReferenceCloneData.scenarios[1].imageSrc}
        />
      </Sequence>
      <Sequence from={scenario3From} durationInFrames={TIMELINE.scenario3}>
        <ReferenceScenarioScene
          badge={skillReferenceCloneData.scenarios[2].badge}
          title={skillReferenceCloneData.scenarios[2].title}
          description={skillReferenceCloneData.scenarios[2].description}
          bullets={skillReferenceCloneData.scenarios[2].bullets}
          imageSrc={skillReferenceCloneData.scenarios[2].imageSrc}
        />
      </Sequence>
      <Sequence from={flowFrom} durationInFrames={TIMELINE.flow}>
        <ReferenceFlowScene
          title={skillReferenceCloneData.flowScene.title}
          steps={skillReferenceCloneData.flowScene.steps}
        />
      </Sequence>
      <Sequence from={mcpCompareFrom} durationInFrames={TIMELINE.mcpCompare}>
        <ReferenceCompareScene
          title={skillReferenceCloneData.mcpCompare.title}
          leftTitle={skillReferenceCloneData.mcpCompare.leftLabel}
          rightTitle={skillReferenceCloneData.mcpCompare.rightLabel}
          leftPoints={[skillReferenceCloneData.mcpCompare.leftBody]}
          rightPoints={[skillReferenceCloneData.mcpCompare.rightBody]}
          footer={skillReferenceCloneData.mcpCompare.footer}
        />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <ReferenceCloseScene
          headline={skillReferenceCloneData.closeScene.headline}
          subheadline={skillReferenceCloneData.closeScene.subheadline}
        />
      </Sequence>
      <SubtitleTrack cues={skillReferenceCloneAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
