import { AbsoluteFill, Sequence } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { macdIndicatorAudio } from "../data/macdIndicatorAudio";
import { macdIndicatorData } from "../data/macdIndicatorData";
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

export const MacdIndicatorComposition: React.FC = () => {
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
      <AudioTrackLayer config={macdIndicatorAudio} />
      <Sequence from={hookFrom} durationInFrames={TIMELINE.hook}>
        <ReferenceHookScene frames={macdIndicatorData.hookFrames} />
      </Sequence>
      <Sequence from={docFrom} durationInFrames={TIMELINE.doc}>
        <ReferenceDocScene
          path={macdIndicatorData.docScene.path}
          filename={macdIndicatorData.docScene.filename}
          headline={macdIndicatorData.docScene.headline}
          cards={macdIndicatorData.docScene.cards}
        />
      </Sequence>
      <Sequence from={compareFrom} durationInFrames={TIMELINE.compare}>
        <ReferenceCompareScene
          leftTitle={macdIndicatorData.compareScene.leftTitle}
          rightTitle={macdIndicatorData.compareScene.rightTitle}
          leftPoints={macdIndicatorData.compareScene.leftPoints}
          rightPoints={macdIndicatorData.compareScene.rightPoints}
          footer={macdIndicatorData.compareScene.footer}
        />
      </Sequence>
      <Sequence from={scenario1From} durationInFrames={TIMELINE.scenario1}>
        <ReferenceScenarioScene
          badge={macdIndicatorData.scenarios[0].badge}
          title={macdIndicatorData.scenarios[0].title}
          description={macdIndicatorData.scenarios[0].description}
          bullets={macdIndicatorData.scenarios[0].bullets}
          imageSrc={macdIndicatorData.scenarios[0].imageSrc}
        />
      </Sequence>
      <Sequence from={scenario2From} durationInFrames={TIMELINE.scenario2}>
        <ReferenceScenarioScene
          badge={macdIndicatorData.scenarios[1].badge}
          title={macdIndicatorData.scenarios[1].title}
          description={macdIndicatorData.scenarios[1].description}
          bullets={macdIndicatorData.scenarios[1].bullets}
          imageSrc={macdIndicatorData.scenarios[1].imageSrc}
        />
      </Sequence>
      <Sequence from={scenario3From} durationInFrames={TIMELINE.scenario3}>
        <ReferenceScenarioScene
          badge={macdIndicatorData.scenarios[2].badge}
          title={macdIndicatorData.scenarios[2].title}
          description={macdIndicatorData.scenarios[2].description}
          bullets={macdIndicatorData.scenarios[2].bullets}
          imageSrc={macdIndicatorData.scenarios[2].imageSrc}
        />
      </Sequence>
      <Sequence from={flowFrom} durationInFrames={TIMELINE.flow}>
        <ReferenceFlowScene
          title={macdIndicatorData.flowScene.title}
          steps={macdIndicatorData.flowScene.steps}
        />
      </Sequence>
      <Sequence
        from={conceptCompareFrom}
        durationInFrames={TIMELINE.conceptCompare}
      >
        <ReferenceCompareScene
          title={macdIndicatorData.conceptCompare.title}
          leftTitle={macdIndicatorData.conceptCompare.leftLabel}
          rightTitle={macdIndicatorData.conceptCompare.rightLabel}
          leftPoints={[macdIndicatorData.conceptCompare.leftBody]}
          rightPoints={[macdIndicatorData.conceptCompare.rightBody]}
          footer={macdIndicatorData.conceptCompare.footer}
        />
      </Sequence>
      <Sequence from={closeFrom} durationInFrames={TIMELINE.close}>
        <ReferenceCloseScene
          headline={macdIndicatorData.closeScene.headline}
          subheadline={macdIndicatorData.closeScene.subheadline}
        />
      </Sequence>
      <SubtitleTrack cues={macdIndicatorAudio.subtitles ?? []} />
    </AbsoluteFill>
  );
};
