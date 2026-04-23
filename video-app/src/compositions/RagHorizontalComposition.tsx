import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { ragReferenceCloneData } from "../data/ragReferenceCloneData";
import { ragReferenceCloneAudio } from "../data/ragReferenceCloneAudio";
import { ReferenceCloseScene } from "../scenes/reference/ReferenceCloseScene";
import { ReferenceCompareScene } from "../scenes/reference/ReferenceCompareScene";
import { ReferenceDocScene } from "../scenes/reference/ReferenceDocScene";
import { ReferenceFlowScene } from "../scenes/reference/ReferenceFlowScene";
import { ReferenceHookScene } from "../scenes/reference/ReferenceHookScene";
import { ReferenceScenarioScene } from "../scenes/reference/ReferenceScenarioScene";

const TIMELINE = {
  hook: 150,
  doc: 240,
  compare: 180,
  scenario1: 180,
  scenario2: 180,
  scenario3: 180,
  flow: 150,
  conceptCompare: 240,
  close: 300,
} as const;

export const RagHorizontalComposition: React.FC = () => {
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
    <AbsoluteFill style={{ backgroundColor: "#080808" }}>
      <AudioTrackLayer config={ragReferenceCloneAudio} />
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <ReferenceHookScene frames={ragReferenceCloneData.hookFrames} />
      </Sequence>
      <Sequence from={docFrom} durationInFrames={TIMELINE.doc}>
        <ReferenceDocScene
          path={ragReferenceCloneData.docScene.path}
          filename={ragReferenceCloneData.docScene.filename}
          headline={ragReferenceCloneData.docScene.headline}
          cards={ragReferenceCloneData.docScene.cards}
        />
      </Sequence>
      <Sequence from={compareFrom} durationInFrames={TIMELINE.compare}>
        <ReferenceCompareScene
          leftTitle={ragReferenceCloneData.compareScene.leftTitle}
          rightTitle={ragReferenceCloneData.compareScene.rightTitle}
          leftPoints={ragReferenceCloneData.compareScene.leftPoints}
          rightPoints={ragReferenceCloneData.compareScene.rightPoints}
          footer={ragReferenceCloneData.compareScene.footer}
        />
      </Sequence>
      <Sequence from={scenario1From} durationInFrames={TIMELINE.scenario1}>
        <ReferenceScenarioScene
          badge={ragReferenceCloneData.scenarios[0].badge}
          title={ragReferenceCloneData.scenarios[0].title}
          description={ragReferenceCloneData.scenarios[0].description}
          bullets={ragReferenceCloneData.scenarios[0].bullets}
          imageSrc={ragReferenceCloneData.scenarios[0].imageSrc}
        />
      </Sequence>
      <Sequence from={scenario2From} durationInFrames={TIMELINE.scenario2}>
        <ReferenceScenarioScene
          badge={ragReferenceCloneData.scenarios[1].badge}
          title={ragReferenceCloneData.scenarios[1].title}
          description={ragReferenceCloneData.scenarios[1].description}
          bullets={ragReferenceCloneData.scenarios[1].bullets}
          imageSrc={ragReferenceCloneData.scenarios[1].imageSrc}
        />
      </Sequence>
      <Sequence from={scenario3From} durationInFrames={TIMELINE.scenario3}>
        <ReferenceScenarioScene
          badge={ragReferenceCloneData.scenarios[2].badge}
          title={ragReferenceCloneData.scenarios[2].title}
          description={ragReferenceCloneData.scenarios[2].description}
          bullets={ragReferenceCloneData.scenarios[2].bullets}
          imageSrc={ragReferenceCloneData.scenarios[2].imageSrc}
        />
      </Sequence>
      <Sequence from={flowFrom} durationInFrames={TIMELINE.flow}>
        <ReferenceFlowScene
          title={ragReferenceCloneData.flowScene.title}
          steps={ragReferenceCloneData.flowScene.steps}
        />
      </Sequence>
      <Sequence
        from={conceptCompareFrom}
        durationInFrames={TIMELINE.conceptCompare}
      >
        <ReferenceCompareScene
          title={ragReferenceCloneData.conceptCompare.title}
          leftTitle={ragReferenceCloneData.conceptCompare.leftLabel}
          rightTitle={ragReferenceCloneData.conceptCompare.rightLabel}
          leftPoints={[ragReferenceCloneData.conceptCompare.leftBody]}
          rightPoints={[ragReferenceCloneData.conceptCompare.rightBody]}
          footer={ragReferenceCloneData.conceptCompare.footer}
        />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <ReferenceCloseScene
          headline={ragReferenceCloneData.closeScene.headline}
          subheadline={ragReferenceCloneData.closeScene.subheadline}
        />
      </Sequence>
      <SubtitleTrack cues={ragReferenceCloneAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
