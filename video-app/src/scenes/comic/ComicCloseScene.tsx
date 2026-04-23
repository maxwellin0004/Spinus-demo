import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ComicArtwork, ComicCaption, ThoughtBubble } from "../../components/comic/ComicPrimitives";
import { THEME } from "../../theme/tokens";

type ComicCloseSceneProps = {
  title: string;
  body: string;
  caption: string;
  imageSrc: string;
};

export const ComicCloseScene: React.FC<ComicCloseSceneProps> = ({ title, body, caption, imageSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bubbleIntro = spring({
    fps,
    frame: frame - 20,
    config: { damping: 16, stiffness: 110 },
  });

  return (
    <AbsoluteFill style={{ background: "#e5edf8", fontFamily: THEME.fonts.bodyZh }}>
      <ComicArtwork src={imageSrc} scale={1.05} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(229,237,248,0.18), rgba(229,237,248,0.08))" }} />
      <div style={{ position: "absolute", left: 86, top: 90, width: 920, fontFamily: THEME.fonts.headlineZh, fontSize: 72, lineHeight: 1.05, color: "#172340", fontWeight: 800 }}>
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: bubbleIntro,
          transform: `translateY(${(1 - bubbleIntro) * 24}px) scale(${0.94 + bubbleIntro * 0.06})`,
          transformOrigin: "1320px 260px",
        }}
      >
        <ThoughtBubble x={1140} y={220} width={560} lines={body.split(" / ")} />
      </div>
      <ComicCaption text={caption} width={1260} />
    </AbsoluteFill>
  );
};
