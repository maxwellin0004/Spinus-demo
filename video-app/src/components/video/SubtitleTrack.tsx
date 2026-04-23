import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SubtitleCue } from "../../lib/audioTypes";
import { THEME } from "../../theme/tokens";

type SubtitleTrackProps = {
  cues: SubtitleCue[];
};

const renderHighlightedText = (text: string, emphasisWords: string[] = []) => {
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
      <span key={`${part}-${index}`} style={{ color: "#ffd166" }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    ),
  );
};

export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({ cues }) => {
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
    config: { damping: 18, stiffness: 140 },
  });

  const isVertical = height > width;
  const subtitleWidth = isVertical ? Math.min(width * 0.88, 860) : Math.min(width * 0.82, 1280);
  const fontSize = isVertical ? 28 : 34;
  const bottom = isVertical ? 84 : 24;
  const padding = isVertical ? "6px 12px" : "6px 16px";

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom,
          transform: `translateX(-50%) translateY(${(1 - intro) * 16}px)`,
          opacity: intro,
          width: subtitleWidth,
          padding,
          borderRadius: 0,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          textAlign: "center",
          fontFamily: THEME.fonts.bodyZh,
          fontSize,
          lineHeight: 1.28,
          fontWeight: 800,
          color: "#ffffff",
          WebkitTextStroke: "1.5px rgba(0,0,0,0.68)",
          paintOrder: "stroke fill",
          textShadow: "0 2px 5px rgba(0,0,0,0.46), 0 0 2px rgba(0,0,0,0.62)",
        }}
      >
        {cue.text.split("\n").map((line, lineIndex) => (
          <div key={`${cue.startFrame}-${lineIndex}`}>{renderHighlightedText(line, cue.emphasisWords)}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
