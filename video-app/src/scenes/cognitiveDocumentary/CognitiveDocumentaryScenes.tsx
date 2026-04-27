import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../../theme/tokens";
import type { CognitiveDocMotion, CognitiveDocScene } from "../../data/cognitiveDocumentaryEssayData";

const tintStyles: Record<CognitiveDocScene["visual"]["tint"], React.CSSProperties> = {
  warm_archive: {
    background:
      "linear-gradient(90deg, rgba(36,20,8,0.52), rgba(10,9,8,0.18), rgba(0,0,0,0.46))",
  },
  cool_institutional: {
    background:
      "linear-gradient(90deg, rgba(7,16,22,0.48), rgba(7,18,28,0.18), rgba(0,0,0,0.4))",
  },
  high_contrast_warning: {
    background:
      "linear-gradient(90deg, rgba(0,0,0,0.62), rgba(62,7,7,0.18), rgba(0,0,0,0.7))",
  },
};

const motionTransform = (motion: CognitiveDocMotion, progress: number) => {
  const push = interpolate(progress, [0, 1], [1.02, 1.08]);
  const impact = interpolate(progress, [0, 0.18, 1], [1.12, 1.04, 1.07]);

  if (motion === "slow_pan_left") {
    return `scale(1.08) translateX(${interpolate(progress, [0, 1], [22, -22])}px)`;
  }

  if (motion === "slow_pan_right") {
    return `scale(1.08) translateX(${interpolate(progress, [0, 1], [-22, 22])}px)`;
  }

  if (motion === "impact_zoom") {
    return `scale(${impact})`;
  }

  if (motion === "static_hold") {
    return "scale(1.04)";
  }

  return `scale(${push})`;
};

const FilmTexture: React.FC = () => (
  <>
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 45%, transparent 0%, rgba(0,0,0,0.18) 62%, rgba(0,0,0,0.64) 100%)",
      }}
    />
    <AbsoluteFill
      style={{
        opacity: 0.13,
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.16) 0, rgba(255,255,255,0.16) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "overlay",
      }}
    />
  </>
);

const ImpactWord: React.FC<{ text: string; variant: CognitiveDocScene["visual"]["tint"] }> = ({
  text,
  variant,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 180 },
  });
  const isWarning = variant === "high_contrast_warning";

  return (
    <div
      style={{
        position: "absolute",
        left: isWarning ? 88 : 96,
        top: isWarning ? 104 : 86,
        transform: `scale(${0.92 + enter * 0.08})`,
        transformOrigin: "left center",
        opacity: Math.min(1, enter * 1.25),
        fontFamily: THEME.fonts.headlineZh,
        fontSize: isWarning ? 92 : 78,
        lineHeight: 0.95,
        fontWeight: 950,
        color: isWarning ? "#f53b31" : "#f0b62d",
        textShadow: "0 5px 0 rgba(0,0,0,0.32), 0 16px 34px rgba(0,0,0,0.45)",
        letterSpacing: 0,
      }}
    >
      {text}
    </div>
  );
};

export const CognitiveDocumentaryScene: React.FC<{ scene: CognitiveDocScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationFrames = Math.max(1, Math.round(scene.durationSec * fps));
  const progress = Math.min(1, frame / durationFrames);
  const text = scene.visual.overlayText;

  return (
    <AbsoluteFill style={{ backgroundColor: "#070605", overflow: "hidden" }}>
      <Img
        src={staticFile(scene.visual.asset)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: motionTransform(scene.visual.motion, progress),
          filter: "contrast(1.08) saturate(0.84)",
        }}
      />
      <AbsoluteFill style={tintStyles[scene.visual.tint]} />
      <FilmTexture />
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 20,
          color: "rgba(255,255,255,0.42)",
          fontFamily: THEME.fonts.ui,
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.05,
          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
        }}
      >
        <div>@MindHacker</div>
        <div>认知刺客</div>
      </div>
      {text ? <ImpactWord text={text} variant={scene.visual.tint} /> : null}
    </AbsoluteFill>
  );
};
