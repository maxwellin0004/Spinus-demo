import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type BilingualQuoteCue = {
  voiceId: string;
  startFrame: number;
  endFrame: number;
  textZh: string;
  textEn: string;
  emphasisWords?: string[];
};

type BilingualQuoteTrackProps = {
  cues: BilingualQuoteCue[];
};

const highlightLine = (text: string, emphasisWords: string[] = []) => {
  if (!emphasisWords.length) {
    return text;
  }

  const escaped = emphasisWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (!escaped.length) {
    return text;
  }

  const regex = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    emphasisWords.includes(part) ? (
      <span key={`${part}-${index}`} style={{ color: "#ffe082" }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    ),
  );
};

export const BilingualQuoteTrack: React.FC<BilingualQuoteTrackProps> = ({ cues }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cue = cues.find((item) => frame >= item.startFrame && frame <= item.endFrame);

  if (!cue) {
    return null;
  }

  const localFrame = frame - cue.startFrame;
  const intro = spring({
    fps,
    frame: localFrame,
    config: { damping: 18, stiffness: 160 },
  });
  const isVertical = height >= width;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: isVertical ? 56 : 40,
          transform: `translateX(-50%) translateY(${(1 - intro) * 14}px)`,
          opacity: intro,
          width: isVertical ? Math.min(width * 0.84, 560) : Math.min(width * 0.72, 1120),
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: '"NotoSansSC", sans-serif',
            fontWeight: 900,
            fontSize: isVertical ? 38 : 42,
            lineHeight: 1.18,
            color: "#f4d03f",
            WebkitTextStroke: "1.4px rgba(0,0,0,0.72)",
            textShadow: "0 3px 10px rgba(0,0,0,0.58)",
          }}
        >
          {cue.textZh.split("\n").map((line, index) => (
            <div key={`zh-${cue.startFrame}-${index}`}>{highlightLine(line, cue.emphasisWords)}</div>
          ))}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: isVertical ? 20 : 24,
            lineHeight: 1.15,
            color: "#ffffff",
            textShadow: "0 2px 6px rgba(0,0,0,0.68)",
          }}
        >
          {cue.textEn.split("\n").map((line, index) => (
            <div key={`en-${cue.startFrame}-${index}`}>{line}</div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
