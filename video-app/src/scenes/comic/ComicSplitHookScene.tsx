import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ComicArtwork, ComicCaption } from "../../components/comic/ComicPrimitives";
import { THEME } from "../../theme/tokens";

type ComicSplitHookSceneProps = {
  leftLabel: string;
  rightLabel: string;
  title: string;
  subtitle: string;
  caption: string;
  leftImageSrc: string;
  rightImageSrc: string;
};

export const ComicSplitHookScene: React.FC<ComicSplitHookSceneProps> = ({
  leftLabel,
  rightLabel,
  title,
  subtitle,
  caption,
  leftImageSrc,
  rightImageSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ fps, frame, config: { damping: 18, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ background: "#13162a", overflow: "hidden", fontFamily: THEME.fonts.bodyZh }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <ComicArtwork src={leftImageSrc} scale={1.06} y={-16} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,13,24,0.18) 0%, rgba(11,13,24,0.42) 100%)" }} />
          <div
            style={{
              position: "absolute",
              top: 42,
              left: 52,
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(255,95,84,0.92)",
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {leftLabel}
          </div>
        </div>
        <div style={{ position: "relative", overflow: "hidden", background: "#f5f1ff" }}>
          <ComicArtwork src={rightImageSrc} scale={1.06} y={-16} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 20%, rgba(154,117,255,0.12), transparent 32%)" }} />
          <div
            style={{
              position: "absolute",
              top: 42,
              right: 52,
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(84,108,255,0.92)",
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {rightLabel}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 16, transform: "translateX(-50%)", background: "#f4f6ff", boxShadow: "0 0 24px rgba(255,255,255,0.28)" }} />
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 90,
          width: 1640,
          textAlign: "center",
          opacity: intro,
          transform: `translateY(${(1 - intro) * 28}px)`,
        }}
      >
        <div style={{ fontSize: 100, lineHeight: 1, fontWeight: 900, color: "#ff3c3c", fontFamily: THEME.fonts.headlineZh, textShadow: "0 8px 40px rgba(0,0,0,0.34)" }}>
          {title}
        </div>
        <div style={{ marginTop: 16, fontSize: 34, color: "#f6f7ff", fontWeight: 700 }}>{subtitle}</div>
      </div>
      <ComicCaption text={caption} width={1320} />
    </AbsoluteFill>
  );
};
