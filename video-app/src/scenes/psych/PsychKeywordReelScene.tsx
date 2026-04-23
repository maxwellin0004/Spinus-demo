import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

const pickWord = (frame: number, words: readonly string[]) => {
  const idx = Math.min(words.length - 1, Math.floor(frame / 18));
  return words[idx] ?? "";
};

export const PsychKeywordReelScene: React.FC<{ words: readonly string[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const word = pickWord(frame, words);
  return (
    <AbsoluteFill style={{ background: "#080808", justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          inset: 16,
          border: "18px solid #191817",
          boxShadow: "inset 0 0 0 2px rgba(202,137,61,0.35)",
          borderRadius: 24,
        }}
      />
      <div
        style={{
          fontSize: 118,
          fontWeight: 700,
          color: "white",
          letterSpacing: 6,
          opacity: interpolate(frame, [0, 8, 42, 54], [0, 1, 1, 0]),
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
};
