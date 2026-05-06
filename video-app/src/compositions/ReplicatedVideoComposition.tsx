import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import { SubtitleTrack } from "../components/video/SubtitleTrack";
import type { AudioLayerConfig } from "../lib/audioTypes";

type StyleTokens = {
  backgroundBase?: string;
  backgroundSoft?: string;
  accent?: string;
  textPrimary?: string;
  textMuted?: string;
  frame?: string;
};

type ReplicatedScene = {
  sceneId: string;
  role: string;
  moduleId: string;
  durationInFrames: number;
  copy: {
    headline: string;
    body: string;
    bullets?: string[];
    keywords?: string[];
    copyStatus?: string;
  };
  visual?: {
    layoutTags?: string[];
    retentionTags?: string[];
    layoutIntent?: string;
    styleTokens?: StyleTokens;
  };
  motion?: {
    motionPreset?: string;
  };
  resolvedAssets?: Array<{
    assetId?: string;
    slot?: string;
    assetType?: string;
    providerUsed?: string;
    publicPath?: string;
    width?: number;
    height?: number;
    status?: string;
  }>;
};

type ReplicatedTimeline = {
  fps: number;
  durationSec: number;
  durationInFrames: number;
  scenes: Array<{
    sceneId: string;
    role: string;
    moduleId: string;
    from: number;
    durationInFrames: number;
  }>;
};

type ReplicatedInputProps = {
  jobId: string;
  topic: string;
  language?: string;
  audio?: AudioLayerConfig;
  style?: {
    variant?: string;
    tokens?: StyleTokens;
  };
  timeline: ReplicatedTimeline;
  scenes: ReplicatedScene[];
  reviewStatus?: {
    status?: string;
    reason?: string;
  };
};

export type ReplicatedVideoRenderProps = {
  composition?: {
    fps?: number;
    width?: number;
    height?: number;
    durationInFrames?: number;
  };
  inputProps: ReplicatedInputProps;
};

const defaultTokens: Required<StyleTokens> = {
  backgroundBase: "#050816",
  backgroundSoft: "#0b1022",
  accent: "#ff7a45",
  textPrimary: "#f7f9ff",
  textMuted: "rgba(247, 249, 255, 0.72)",
  frame: "rgba(255, 255, 255, 0.16)",
};

export const defaultReplicatedVideoProps: ReplicatedVideoRenderProps = {
  composition: {
    fps: 30,
    width: 1080,
    height: 1920,
    durationInFrames: 900,
  },
  inputProps: {
    jobId: "replicated-preview",
    topic: "Preview topic",
    language: "zh-CN",
    style: {
      variant: "dark_warning_orange",
      tokens: defaultTokens,
    },
    timeline: {
      fps: 30,
      durationSec: 30,
      durationInFrames: 900,
      scenes: [
        { sceneId: "scene_01_hook", role: "hook", moduleId: "generic.hook", from: 0, durationInFrames: 150 },
        { sceneId: "scene_02_mechanism", role: "mechanism", moduleId: "generic.mechanism", from: 150, durationInFrames: 360 },
        { sceneId: "scene_03_method", role: "method", moduleId: "generic.method", from: 510, durationInFrames: 270 },
        { sceneId: "scene_04_close", role: "close", moduleId: "generic.close", from: 780, durationInFrames: 120 },
      ],
    },
    scenes: [
      {
        sceneId: "scene_01_hook",
        role: "hook",
        moduleId: "generic.hook",
        durationInFrames: 150,
        copy: {
          headline: "Preview topic, the first assumption is wrong",
          body: "A draft hook appears here for rough visual review.",
          bullets: ["Preserve structure", "Rewrite copy", "Avoid source frames"],
          keywords: ["hook", "structure"],
          copyStatus: "draft_needs_human_or_llm_rewrite",
        },
        visual: {
          layoutTags: ["large_text_center"],
          retentionTags: ["curiosity_gap"],
          layoutIntent: "Large title opening.",
          styleTokens: defaultTokens,
        },
      },
      {
        sceneId: "scene_02_mechanism",
        role: "mechanism",
        moduleId: "generic.mechanism",
        durationInFrames: 360,
        copy: {
          headline: "The mechanism",
          body: "Explain cause, trigger, and result with structured panels.",
          bullets: ["Cause", "Trigger", "Visible result"],
          keywords: ["mechanism"],
        },
      },
      {
        sceneId: "scene_03_method",
        role: "method",
        moduleId: "generic.method",
        durationInFrames: 270,
        copy: {
          headline: "Turn it into actions",
          body: "Convert the explanation into a compact checklist.",
          bullets: ["Name the trigger", "Lower the friction", "Repeat the cue"],
          keywords: ["method"],
        },
      },
      {
        sceneId: "scene_04_close",
        role: "close",
        moduleId: "generic.close",
        durationInFrames: 120,
        copy: {
          headline: "Remember the pattern",
          body: "The closing line stays original and compact.",
          bullets: ["Review before final render"],
          keywords: ["close"],
        },
      },
    ],
  },
};

const mergeTokens = (base?: StyleTokens, override?: StyleTokens): Required<StyleTokens> => ({
  ...defaultTokens,
  ...base,
  ...override,
});

const fitText = (text: string, baseSize: number, minSize: number) => {
  const length = Array.from(text).length;
  if (length <= 14) return baseSize;
  if (length <= 24) return Math.max(minSize, baseSize - 8);
  if (length <= 36) return Math.max(minSize, baseSize - 16);
  return minSize;
};

const getSceneLabel = (role: string) => {
  const labels: Record<string, string> = {
    hook: "HOOK",
    problem: "PROBLEM",
    setup: "SETUP",
    mechanism: "MECHANISM",
    case: "CASE",
    evidence: "EVIDENCE",
    contrast: "CONTRAST",
    method: "METHOD",
    checklist: "CHECKLIST",
    close: "CLOSE",
    cta: "CTA",
  };
  return labels[role] ?? role.toUpperCase();
};

const resolvePublicAsset = (publicPath?: string) => {
  if (!publicPath) return undefined;
  if (/^https?:\/\//.test(publicPath)) return publicPath;
  return staticFile(publicPath.replace(/^\/+/, ""));
};

const ScenePreview: React.FC<{
  scene: ReplicatedScene;
  index: number;
  total: number;
  globalTokens: Required<StyleTokens>;
}> = ({ scene, index, total, globalTokens }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;
  const tokens = mergeTokens(globalTokens, scene.visual?.styleTokens);
  const appear = spring({ frame, fps, config: { damping: 18, stiffness: 90, mass: 0.8 } });
  const slide = interpolate(appear, [0, 1], [18, 0]);
  const contentOpacity = interpolate(appear, [0, 1], [0.42, 1]);
  const progress = interpolate(frame, [0, Math.max(1, scene.durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineSize = fitText(scene.copy.headline, isPortrait ? 70 : 78, isPortrait ? 42 : 46);
  const bodySize = fitText(scene.copy.body, isPortrait ? 33 : 34, isPortrait ? 24 : 25);
  const bullets = scene.copy.bullets?.slice(0, 3) ?? [];
  const keywords = scene.copy.keywords?.slice(0, 4) ?? [];
  const primaryAsset = scene.resolvedAssets?.find((asset) => asset.assetType === "image" && asset.publicPath);
  const primaryAssetSrc = resolvePublicAsset(primaryAsset?.publicPath);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${tokens.backgroundBase}, ${tokens.backgroundSoft})`,
        color: tokens.textPrimary,
        fontFamily: "NotoSansSC, SourceSans3, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${tokens.frame} 1px, transparent 1px), linear-gradient(90deg, ${tokens.frame} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          opacity: 0.18,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: isPortrait ? 48 : 72,
          right: isPortrait ? 48 : 72,
          top: isPortrait ? 56 : 48,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: tokens.textMuted,
          fontFamily: "SourceSans3, sans-serif",
          fontSize: 20,
        }}
      >
        <span>{getSceneLabel(scene.role)}</span>
        <span>
          {index + 1}/{total} · {scene.moduleId}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: isPortrait ? 48 : 72,
          right: isPortrait ? 48 : 72,
          top: isPortrait ? 170 : 148,
          bottom: isPortrait ? 180 : 132,
          display: "grid",
          gridTemplateRows: isPortrait ? "auto 1fr auto" : "auto auto 1fr",
          gap: isPortrait ? 42 : 30,
          transform: `translateY(${slide}px)`,
          opacity: contentOpacity,
        }}
      >
        <div>
          <div
            style={{
              width: 84,
              height: 5,
              background: tokens.accent,
              marginBottom: 28,
            }}
          />
          <div
            style={{
              fontSize: headlineSize,
              lineHeight: 1.08,
              fontWeight: 700,
              maxWidth: isPortrait ? 880 : 1320,
            }}
          >
            {scene.copy.headline}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isPortrait ? "1fr" : "1.1fr 0.9fr",
            gap: 28,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              border: `1px solid ${tokens.frame}`,
              background: "rgba(255,255,255,0.045)",
              padding: isPortrait ? 30 : 34,
              minHeight: isPortrait ? 260 : 230,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: bodySize, lineHeight: 1.36, color: tokens.textPrimary }}>{scene.copy.body}</div>
            <div style={{ marginTop: 28, color: tokens.textMuted, fontSize: 20, lineHeight: 1.35 }}>
              {scene.visual?.layoutIntent ?? "Compiled rough preview scene."}
            </div>
          </div>

          <div
            style={{
              border: `1px solid ${tokens.frame}`,
              background: "rgba(0,0,0,0.18)",
              padding: isPortrait ? 22 : 26,
              display: "grid",
              gridTemplateRows: primaryAssetSrc ? "1fr auto" : "1fr",
              gap: 18,
              overflow: "hidden",
            }}
          >
            {primaryAssetSrc ? (
              <div
                style={{
                  minHeight: isPortrait ? 360 : 220,
                  border: `1px solid ${tokens.frame}`,
                  background: "rgba(255,255,255,0.04)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Img
                  src={primaryAssetSrc}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                justifyContent: "center",
              }}
            >
              {bullets.map((bullet, bulletIndex) => (
                <div
                  key={bullet}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "42px 1fr",
                    alignItems: "start",
                    gap: 16,
                    opacity: interpolate(frame, [bulletIndex * 8, bulletIndex * 8 + 12], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                  }}
                >
                  <div style={{ color: tokens.accent, fontFamily: "Orbitron, sans-serif", fontSize: 22 }}>
                    {String(bulletIndex + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: isPortrait ? 27 : 25, lineHeight: 1.25 }}>{bullet}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {keywords.map((keyword) => (
            <span
              key={keyword}
              style={{
                border: `1px solid ${tokens.frame}`,
                color: tokens.textMuted,
                padding: "8px 12px",
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 5,
          background: tokens.frame,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: tokens.accent,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const resolveInputProps = (props: ReplicatedVideoRenderProps | ReplicatedInputProps): ReplicatedInputProps => {
  if ("inputProps" in props) {
    return props.inputProps;
  }
  return props;
};

const resolveComposition = (props: ReplicatedVideoRenderProps | ReplicatedInputProps) => {
  if ("composition" in props) {
    return props.composition;
  }
  return undefined;
};

export const getReplicatedVideoDurationFromProps = (props: ReplicatedVideoRenderProps | ReplicatedInputProps) => {
  const inputProps = resolveInputProps(props);
  return Math.max(1, inputProps.timeline.durationInFrames);
};

export const calculateReplicatedVideoMetadata: CalculateMetadataFunction<ReplicatedVideoRenderProps | ReplicatedInputProps> = ({
  props,
}) => {
  const inputProps = resolveInputProps(props);
  const composition = resolveComposition(props);
  return {
    durationInFrames: getReplicatedVideoDurationFromProps(props),
    fps: composition?.fps ?? inputProps.timeline.fps,
    width: composition?.width,
    height: composition?.height,
  };
};

export const ReplicatedVideoComposition: React.FC<ReplicatedVideoRenderProps | ReplicatedInputProps> = (props) => {
  const inputProps = resolveInputProps(props);
  const tokens = mergeTokens(inputProps.style?.tokens);
  const sceneById = new Map(inputProps.scenes.map((scene) => [scene.sceneId, scene]));

  return (
    <AbsoluteFill style={{ background: tokens.backgroundBase }}>
      {inputProps.audio ? <AudioTrackLayer config={inputProps.audio} /> : null}
      {inputProps.timeline.scenes.map((timelineScene, index) => {
        const scene = sceneById.get(timelineScene.sceneId);
        if (!scene) return null;
        return (
          <Sequence key={timelineScene.sceneId} from={timelineScene.from} durationInFrames={timelineScene.durationInFrames}>
            <ScenePreview scene={scene} index={index} total={inputProps.timeline.scenes.length} globalTokens={tokens} />
          </Sequence>
        );
      })}
      <SubtitleTrack cues={inputProps.audio?.subtitles ?? []} fontSize={inputProps.audio?.subtitleStyle?.fontSize} color={inputProps.audio?.subtitleStyle?.color} />
    </AbsoluteFill>
  );
};
