import { AbsoluteFill, Sequence } from "remotion";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import { techArchiveData, techArchiveSubtitles } from "../data/techArchiveData";
import {
  TechArchiveChapterScene,
  TechArchiveCloseScene,
  TechArchiveHookScene,
} from "../scenes/techArchive/TechArchiveScenes";

const TIMELINE = {
  hook: 300,
  chapter: 270,
  close: 420,
} as const;

export const TECH_ARCHIVE_DURATION_IN_FRAMES =
  TIMELINE.hook + techArchiveData.chapters.length * TIMELINE.chapter + TIMELINE.close;

export const TechArchiveExplainerComposition: React.FC = () => {
  const chapterStart = TIMELINE.hook;
  const closeStart = chapterStart + techArchiveData.chapters.length * TIMELINE.chapter;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070a" }}>
      <Sequence durationInFrames={TIMELINE.hook}>
        <TechArchiveHookScene
          kicker={techArchiveData.kicker}
          leftMetric={techArchiveData.hook.leftMetric}
          rightMetric={techArchiveData.hook.rightMetric}
          question={techArchiveData.hook.question}
          answer={techArchiveData.hook.answer}
        />
      </Sequence>
      {techArchiveData.chapters.map((chapter, index) => (
        <Sequence key={chapter.id} from={chapterStart + index * TIMELINE.chapter} durationInFrames={TIMELINE.chapter}>
          <TechArchiveChapterScene chapter={chapter} index={index} />
        </Sequence>
      ))}
      <Sequence from={closeStart} durationInFrames={TIMELINE.close}>
        <TechArchiveCloseScene title={techArchiveData.close.title} body={techArchiveData.close.body} tags={techArchiveData.close.tags} />
      </Sequence>
      <SubtitleTrack cues={techArchiveSubtitles} />
    </AbsoluteFill>
  );
};
