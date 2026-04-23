import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ComicArtwork } from "../../components/comic/ComicPrimitives";
import { THEME } from "../../theme/tokens";

type MechanismStep = {
  title: string;
  body: string;
};

type ComicMechanismSceneProps = {
  tag: string;
  title: string;
  steps: readonly MechanismStep[];
  caption: string;
  imageSrc: string;
};

export const ComicMechanismScene: React.FC<ComicMechanismSceneProps> = ({ tag, title, steps, caption, imageSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ fps, frame, config: { damping: 20, stiffness: 110 } });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1a1f37 0%, #101422 100%)", color: "#fff", fontFamily: THEME.fonts.bodyZh }}>
      <ComicArtwork src={imageSrc} scale={1.03} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(16,20,34,0.30) 0%, rgba(16,20,34,0.56) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(138,113,255,0.12), transparent 40%)" }} />
      <div style={{ position: "absolute", top: 56, left: 70, color: "#b5c1ff", fontSize: 24, letterSpacing: 2 }}>{tag}</div>
      <div style={{ position: "absolute", top: 104, left: 70, width: 1040, fontFamily: THEME.fonts.headlineZh, fontWeight: 800, fontSize: 64, lineHeight: 1.05, opacity: intro }}>
        {title}
      </div>
      <div style={{ position: "absolute", left: 210, top: 350, display: "grid", gap: 22 }}>
        {steps.map((step, index) => {
          const local = spring({ fps, frame: frame - index * 6, config: { damping: 16, stiffness: 120 } });
          return (
            <div
              key={step.title}
              style={{
                width: 360,
                padding: "22px 24px",
                borderRadius: 28,
                background: "rgba(255,255,255,0.08)",
                border: "2px solid rgba(255,255,255,0.14)",
                transform: `translateX(${(1 - local) * -24}px)`,
                opacity: local,
              }}
            >
              <div style={{ color: "#ffce6f", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 24, lineHeight: 1.45, color: "rgba(245,247,255,0.84)" }}>{step.body}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: 120, top: 350, display: "grid", gap: 22 }}>
        {steps.map((step, index) => {
          const local = spring({ fps, frame: frame - index * 6 - 3, config: { damping: 16, stiffness: 120 } });
          return (
            <div
              key={`${step.title}-mirror`}
              style={{
                width: 360,
                padding: "22px 24px",
                borderRadius: 28,
                background: "rgba(122,140,255,0.12)",
                border: "2px solid rgba(145,160,255,0.22)",
                transform: `translateX(${(1 - local) * 24}px)`,
                opacity: local,
              }}
            >
              <div style={{ color: "#9fafff", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>结果 {index + 1}</div>
              <div style={{ fontSize: 24, lineHeight: 1.45, color: "rgba(245,247,255,0.78)" }}>{step.body}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 60, transform: "translateX(-50%)", width: 1260, padding: "18px 26px", borderRadius: 30, background: "rgba(7,10,18,0.68)", border: "2px solid rgba(255,255,255,0.14)", fontSize: 38, fontWeight: 700, textAlign: "center" }}>
        {caption}
      </div>
    </AbsoluteFill>
  );
};
