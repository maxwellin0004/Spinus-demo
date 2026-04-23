import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ComicArtwork, ComicCaption, MiniIconCloud, ThoughtBubble } from "../../components/comic/ComicPrimitives";
import { THEME } from "../../theme/tokens";

type ComicStorySceneProps = {
  backgroundTone?: "night" | "day" | "desk";
  mood?: "neutral" | "sad" | "worried" | "tired" | "determined";
  caption: string;
  kicker?: string;
  title?: string;
  bubbleLines?: readonly string[];
  bubbleX?: number;
  bubbleY?: number;
  icons?: string[];
  imageSrc: string;
  insetImageSrc?: string;
};

export const ComicStoryScene: React.FC<ComicStorySceneProps> = ({
  backgroundTone = "night",
  caption,
  kicker,
  title,
  bubbleLines,
  bubbleX = 1260,
  bubbleY = 180,
  icons,
  imageSrc,
  insetImageSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ fps, frame, config: { damping: 18, stiffness: 120 } });
  const bubbleIntro = spring({
    fps,
    frame: frame - 18,
    config: { damping: 16, stiffness: 110 },
  });

  return (
    <AbsoluteFill style={{ background: backgroundTone === "day" ? "#dfe8f4" : "#222b49", fontFamily: THEME.fonts.bodyZh }}>
      <ComicArtwork src={imageSrc} scale={1.08} y={-14} />
      <div style={{ position: "absolute", inset: 0, background: backgroundTone === "day" ? "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(46,56,92,0.08) 100%)" : "linear-gradient(180deg, rgba(12,15,26,0.10) 0%, rgba(12,15,26,0.30) 100%)" }} />
      {kicker ? (
        <div style={{ position: "absolute", top: 58, left: 72, padding: "10px 16px", borderRadius: 999, background: "rgba(61,75,131,0.92)", color: "#fff", fontSize: 22, fontWeight: 700 }}>
          {kicker}
        </div>
      ) : null}
      {title ? (
        <div style={{ position: "absolute", left: 80, top: 122, width: 980, fontFamily: THEME.fonts.headlineZh, fontSize: 70, lineHeight: 1.06, color: backgroundTone === "day" ? "#172340" : "#f7f8ff", fontWeight: 800, opacity: intro }}>
          {title}
        </div>
      ) : null}
      {insetImageSrc ? (
        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 188,
            width: 430,
            height: 250,
            borderRadius: 28,
            overflow: "hidden",
            border: "4px solid rgba(255,255,255,0.78)",
            boxShadow: "0 18px 42px rgba(11,13,24,0.22)",
            opacity: intro,
            transform: `translateY(${(1 - intro) * 18}px)`,
          }}
        >
          <ComicArtwork src={insetImageSrc} scale={1.04} />
        </div>
      ) : null}
      {bubbleLines?.length ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: bubbleIntro,
            transform: `translateY(${(1 - bubbleIntro) * 28}px) scale(${0.94 + bubbleIntro * 0.06})`,
            transformOrigin: `${bubbleX + 120}px ${bubbleY + 40}px`,
          }}
        >
          <ThoughtBubble x={bubbleX} y={bubbleY} width={460} lines={bubbleLines} />
        </div>
      ) : null}
      {icons?.length ? <MiniIconCloud x={1340} y={360} icons={icons} /> : null}
      <ComicCaption text={caption} />
    </AbsoluteFill>
  );
};
