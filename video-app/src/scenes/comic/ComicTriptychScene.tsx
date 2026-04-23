import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ComicArtwork } from "../../components/comic/ComicPrimitives";
import { THEME } from "../../theme/tokens";

type TriptychCard = {
  title: string;
  body: string;
  badge: string;
  mood: "neutral" | "sad" | "worried" | "tired" | "determined";
  imageSrc: string;
};

type ComicTriptychSceneProps = {
  title: string;
  cards: readonly TriptychCard[];
  caption: string;
};

export const ComicTriptychScene: React.FC<ComicTriptychSceneProps> = ({ title, cards, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cycle = 90;
  const activeIndex = Math.min(cards.length - 1, Math.floor(frame / cycle));

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #f6f7ff 0%, #eceffd 100%)", color: "#15203f", fontFamily: THEME.fonts.bodyZh }}>
      <div style={{ position: "absolute", top: 56, left: 76, width: 1480, fontFamily: THEME.fonts.headlineZh, fontSize: 66, lineHeight: 1.05, fontWeight: 800 }}>
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 92,
          right: 92,
          top: 208,
          bottom: 156,
          overflow: "hidden",
        }}
      >
        {cards.map((card, index) => {
          const turnIn = spring({
            fps,
            frame: frame - index * cycle,
            config: { damping: 18, stiffness: 120 },
          });
          const distance = index - activeIndex;
          const baseX = distance * 340;
          const baseY = Math.abs(distance) * 22;
          const scale = distance === 0 ? 1 : distance < 0 ? 0.9 : 0.84;
          const rotate = distance === 0 ? 0 : distance < 0 ? -8 : 7;
          const opacity = distance < -1 || distance > 1 ? 0 : distance === 0 ? 1 : 0.72;
          const width = distance === 0 ? 980 : 760;
          const zIndex = 10 - Math.abs(distance);
          const revealOffset = (1 - turnIn) * (distance <= 0 ? -160 : 160);

          return (
            <div
              key={card.title}
              style={{
                position: "absolute",
                left: "50%",
                top: distance === 0 ? 4 : 54,
                width,
                minHeight: distance === 0 ? 620 : 560,
                borderRadius: 36,
                background: "#ffffff",
                border: distance === 0 ? "3px solid rgba(80,105,244,0.24)" : "2px solid rgba(62,84,154,0.10)",
                boxShadow:
                  distance === 0
                    ? "0 28px 80px rgba(41,57,116,0.18)"
                    : "0 18px 44px rgba(41,57,116,0.12)",
                overflow: "hidden",
                transform: `translateX(calc(-50% + ${baseX + revealOffset}px)) translateY(${baseY}px) scale(${scale}) rotate(${rotate}deg)`,
                opacity,
                zIndex,
              }}
            >
              <div style={{ height: distance === 0 ? 330 : 280, background: "linear-gradient(180deg, #edf0ff 0%, #dbe4ff 100%)", position: "relative" }}>
                <ComicArtwork src={card.imageSrc} scale={distance === 0 ? 1.06 : 1.02} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(31,42,82,0.05))" }} />
                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    top: 20,
                    padding: "8px 16px",
                    borderRadius: 999,
                    background: distance === 0 ? "#5069f4" : "rgba(80,105,244,0.82)",
                    color: "#fff",
                    fontSize: 21,
                    fontWeight: 700,
                  }}
                >
                  {card.badge}
                </div>
              </div>
              <div style={{ padding: distance === 0 ? "28px 30px 32px" : "24px 24px 28px" }}>
                <div style={{ fontSize: distance === 0 ? 42 : 34, lineHeight: 1.18, fontWeight: 800, marginBottom: 12 }}>{card.title}</div>
                <div style={{ fontSize: distance === 0 ? 28 : 25, lineHeight: 1.5, color: "rgba(21,32,63,0.76)" }}>{card.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 48, transform: "translateX(-50%)", width: 1320, padding: "18px 26px", borderRadius: 30, background: "rgba(255,255,255,0.94)", border: "2px solid rgba(62,84,154,0.12)", fontSize: 38, fontWeight: 700, textAlign: "center", boxShadow: "0 14px 38px rgba(41,57,116,0.12)" }}>
        {caption}
      </div>
    </AbsoluteFill>
  );
};
