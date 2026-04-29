import "./index.css";
import { Composition } from "remotion";
import { AgentHorizontalComposition } from "./compositions/AgentHorizontalComposition";
import { ComicEmotionalScrollComposition } from "./compositions/ComicEmotionalScrollComposition";
import { ComicHabitSpiralComposition } from "./compositions/ComicHabitSpiralComposition";
import {
  CodexJobComposition,
  defaultCodexJobProps,
  getCodexJobDurationFromProps,
} from "./compositions/CodexJobComposition";
import { MacdIndicatorComposition } from "./compositions/MacdIndicatorComposition";
import { MinimalPsychExplainerComposition } from "./compositions/MinimalPsychExplainerComposition";
import { NewSignalsComposition } from "./compositions/NewSignalsComposition";
import { NewSignalsRsiComposition } from "./compositions/NewSignalsRsiComposition";
import { NewSignalsVolumeComposition } from "./compositions/NewSignalsVolumeComposition";
import { McpHorizontalComposition } from "./compositions/McpHorizontalComposition";
import { McpVerticalComposition } from "./compositions/McpVerticalComposition";
import { RagHorizontalComposition } from "./compositions/RagHorizontalComposition";
import { SkillHorizontalComposition } from "./compositions/SkillHorizontalComposition";
import {
  TechArchiveExplainerComposition,
  TECH_ARCHIVE_DURATION_IN_FRAMES,
} from "./compositions/TechArchiveExplainerComposition";
import {
  PhilosophyMontageValidationComposition,
  PHILOSOPHY_MONTAGE_DURATION_IN_FRAMES,
} from "./compositions/PhilosophyMontageValidationComposition";
import {
  PhilosophyMontageStoicBoundaryComposition,
  STOIC_BOUNDARY_DURATION_IN_FRAMES,
} from "./compositions/PhilosophyMontageStoicBoundaryComposition";
import {
  LiteraryEmbersValidationComposition,
  LITERARY_EMBERS_VERTICAL_DURATION_IN_FRAMES,
} from "./compositions/LiteraryEmbersValidationComposition";
import {
  CorporateRetreatDossierComposition,
} from "./compositions/CorporateRetreatDossierComposition";
import { CORPORATE_RETREAT_DOSSIER_DURATION } from "./data/corporateRetreatDossierData";
import {
  CognitiveDocumentaryEssayComposition,
} from "./compositions/CognitiveDocumentaryEssayComposition";
import {
  SleepPostureTaxonomyComposition,
  SLEEP_POSTURE_TAXONOMY_DURATION_IN_FRAMES,
} from "./compositions/SleepPostureTaxonomyComposition";
import {
  SOCIAL_POST_PREVIEW_DURATION_IN_FRAMES,
} from "./data/socialPostPreviewData";
import { SocialPostPreviewComposition } from "./compositions/SocialPostPreviewComposition";
import {
  COMBINATORIAL_PARADOX_DURATION,
  CombinatorialParadoxCinematicComposition,
} from "./compositions/CombinatorialParadoxCinematicComposition";
import {
  FutureIncomeTracksComposition,
} from "./compositions/FutureIncomeTracksComposition";
import {
  defaultFutureIncomeTracksProps,
  FUTURE_INCOME_TRACKS_DURATION_IN_FRAMES,
  futureIncomeTracksTemplateSchema,
} from "./data/futureIncomeTracksData";
import {
  COGNITIVE_DOC_DURATION_IN_FRAMES,
  COGNITIVE_DOC_FPS,
} from "./data/cognitiveDocumentaryEssayData";
import { VIDEO_PROFILES } from "./theme/videoProfiles";

const AGENT_DURATION_IN_FRAMES = 70 * VIDEO_PROFILES.youtubeHorizontal.fps;
const RAG_DURATION_IN_FRAMES = 60 * VIDEO_PROFILES.youtubeHorizontal.fps;
const MACD_DURATION_IN_FRAMES = 60 * VIDEO_PROFILES.youtubeHorizontal.fps;
const NEW_SIGNALS_DURATION_IN_FRAMES = 75 * VIDEO_PROFILES.youtubeHorizontal.fps;
const NEW_SIGNALS_RSI_DURATION_IN_FRAMES = 60 * VIDEO_PROFILES.youtubeHorizontal.fps;
const NEW_SIGNALS_VOLUME_DURATION_IN_FRAMES = 60 * VIDEO_PROFILES.youtubeHorizontal.fps;
const COMIC_HABIT_SPIRAL_DURATION_IN_FRAMES = 60 * VIDEO_PROFILES.youtubeHorizontal.fps;
const COMIC_EMOTIONAL_SCROLL_DURATION_IN_FRAMES = 60 * VIDEO_PROFILES.youtubeHorizontal.fps;
const MINIMAL_PSYCH_EXPLAINER_DURATION_IN_FRAMES = 38 * VIDEO_PROFILES.youtubeHorizontal.fps;
const CODEX_JOB_DURATION_IN_FRAMES = getCodexJobDurationFromProps(defaultCodexJobProps);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="skill-horizontal-preview"
        component={SkillHorizontalComposition}
        durationInFrames={VIDEO_PROFILES.youtubeHorizontal.durationInFrames}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="comic-habit-spiral-preview"
        component={ComicHabitSpiralComposition}
        durationInFrames={COMIC_HABIT_SPIRAL_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="comic-emotional-scroll-preview"
        component={ComicEmotionalScrollComposition}
        durationInFrames={COMIC_EMOTIONAL_SCROLL_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="minimal-psych-explainer-preview"
        component={MinimalPsychExplainerComposition}
        durationInFrames={MINIMAL_PSYCH_EXPLAINER_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="codex-job-preview"
        component={CodexJobComposition}
        durationInFrames={CODEX_JOB_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.tiktokVertical.fps}
        width={VIDEO_PROFILES.tiktokVertical.width}
        height={VIDEO_PROFILES.tiktokVertical.height}
        defaultProps={defaultCodexJobProps}
      />
      <Composition
        id="mcp-horizontal-preview"
        component={McpHorizontalComposition}
        durationInFrames={VIDEO_PROFILES.youtubeHorizontal.durationInFrames}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="mcp-vertical-preview"
        component={McpVerticalComposition}
        durationInFrames={315}
        fps={VIDEO_PROFILES.tiktokVertical.fps}
        width={VIDEO_PROFILES.tiktokVertical.width}
        height={VIDEO_PROFILES.tiktokVertical.height}
      />
      <Composition
        id="agent-horizontal-preview"
        component={AgentHorizontalComposition}
        durationInFrames={AGENT_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="rag-horizontal-preview"
        component={RagHorizontalComposition}
        durationInFrames={RAG_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="macd-indicator-preview"
        component={MacdIndicatorComposition}
        durationInFrames={MACD_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="new-signals-preview"
        component={NewSignalsComposition}
        durationInFrames={NEW_SIGNALS_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="new-signals-rsi-preview"
        component={NewSignalsRsiComposition}
        durationInFrames={NEW_SIGNALS_RSI_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="new-signals-volume-preview"
        component={NewSignalsVolumeComposition}
        durationInFrames={NEW_SIGNALS_VOLUME_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="tech-archive-explainer-preview"
        component={TechArchiveExplainerComposition}
        durationInFrames={TECH_ARCHIVE_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="philosophy-montage-validation-preview"
        component={PhilosophyMontageValidationComposition}
        durationInFrames={PHILOSOPHY_MONTAGE_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="philosophy-montage-stoic-boundary-preview"
        component={PhilosophyMontageStoicBoundaryComposition}
        durationInFrames={STOIC_BOUNDARY_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="literary-embers-validation-preview"
        component={LiteraryEmbersValidationComposition}
        durationInFrames={LITERARY_EMBERS_VERTICAL_DURATION_IN_FRAMES}
        fps={30}
        width={720}
        height={960}
      />
      <Composition
        id="corporate-retreat-dossier-preview"
        component={CorporateRetreatDossierComposition}
        durationInFrames={CORPORATE_RETREAT_DOSSIER_DURATION}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="cognitive-documentary-essay-preview"
        component={CognitiveDocumentaryEssayComposition}
        durationInFrames={COGNITIVE_DOC_DURATION_IN_FRAMES}
        fps={COGNITIVE_DOC_FPS}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="sleep-posture-taxonomy-validation-preview"
        component={SleepPostureTaxonomyComposition}
        durationInFrames={SLEEP_POSTURE_TAXONOMY_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
      <Composition
        id="social-post-preview"
        component={SocialPostPreviewComposition}
        durationInFrames={SOCIAL_POST_PREVIEW_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.tiktokVertical.fps}
        width={VIDEO_PROFILES.tiktokVertical.width}
        height={VIDEO_PROFILES.tiktokVertical.height}
      />
      <Composition
        id="future-income-tracks-preview"
        component={FutureIncomeTracksComposition}
        durationInFrames={FUTURE_INCOME_TRACKS_DURATION_IN_FRAMES}
        fps={VIDEO_PROFILES.tiktokVertical.fps}
        width={VIDEO_PROFILES.tiktokVertical.width}
        height={VIDEO_PROFILES.tiktokVertical.height}
        defaultProps={defaultFutureIncomeTracksProps}
        schema={futureIncomeTracksTemplateSchema}
      />
      <Composition
        id="combinatorial-paradox-cinematic-preview"
        component={CombinatorialParadoxCinematicComposition}
        durationInFrames={COMBINATORIAL_PARADOX_DURATION}
        fps={VIDEO_PROFILES.youtubeHorizontal.fps}
        width={VIDEO_PROFILES.youtubeHorizontal.width}
        height={VIDEO_PROFILES.youtubeHorizontal.height}
      />
    </>
  );
};
