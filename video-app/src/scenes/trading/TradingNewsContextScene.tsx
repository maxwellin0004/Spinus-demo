import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { getTradingScenePalette, type TradingSceneVariant } from "./tradingSceneTheme";

type MediaCard = {
  imageSrc: string;
  label: string;
  caption: string;
};

type TradingNewsContextSceneProps = {
  kicker: string;
  title: string;
  quote: string;
  sourceLabel: string;
  bullets: readonly string[];
  tags: readonly string[];
  mediaCards: readonly MediaCard[];
  variant?: TradingSceneVariant;
};

const clampLines = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export const TradingNewsContextScene: React.FC<TradingNewsContextSceneProps> = ({
  kicker,
  title,
  quote,
  bullets,
  tags,
  mediaCards,
  variant = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ fps, frame, config: { damping: 18, stiffness: 120 } });
  const palette = getTradingScenePalette(variant);

  return (
    <AbsoluteFill
      style={{
        background:
          variant === "light"
            ? "radial-gradient(circle at top left, rgba(47,125,246,0.18), transparent 24%), linear-gradient(180deg, #f9fbff 0%, #eef4fb 100%)"
            : "radial-gradient(circle at top left, rgba(255,110,56,0.2), transparent 24%), linear-gradient(180deg, #0b0d13 0%, #05070b 100%)",
        color: palette.textPrimary,
        fontFamily: THEME.fonts.bodyZh,
        padding: "74px 72px",
      }}
    >
      <div style={{ color: palette.accent, fontSize: 21, letterSpacing: 1, marginBottom: 14 }}>{kicker}</div>
      <div
        style={{
          width: "100%",
          fontFamily: THEME.fonts.headlineZh,
          fontWeight: 700,
          fontSize: 66,
          lineHeight: 1.08,
          marginBottom: 22,
          opacity: intro,
          transform: `translateY(${(1 - intro) * 20}px)`,
          ...clampLines(2),
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: "100%",
          padding: "22px 24px",
          borderRadius: 22,
          background: palette.panel,
          border: `1px solid ${palette.border}`,
          fontSize: 28,
          lineHeight: 1.42,
          color: palette.textSecondary,
          marginBottom: 24,
          boxShadow: palette.shadow,
          ...clampLines(3),
        }}
      >
        “{quote}”
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 22 }}>
        {bullets.map((bullet, index) => {
          const itemIntro = spring({
            fps,
            frame: frame - index * 7,
            config: { damping: 16, stiffness: 120 },
          });
          return (
            <div
              key={bullet}
              style={{
                borderRadius: 20,
                padding: "18px 16px",
                background: palette.panelSoft,
                border: `1px solid ${palette.frame}`,
                minHeight: 132,
                opacity: itemIntro,
                transform: `translateY(${(1 - itemIntro) * 20}px)`,
              }}
            >
              <div style={{ color: palette.accentStrong, fontFamily: THEME.fonts.numbers, fontSize: 19, marginBottom: 10 }}>
                0{index + 1}
              </div>
              <div style={{ fontSize: 23, lineHeight: 1.36, color: palette.textPrimary, ...clampLines(3) }}>{bullet}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 22 }}>
        {mediaCards.map((card, index) => {
            const mediaIntro = spring({
              fps,
              frame: frame - index * 7,
              config: { damping: 16, stiffness: 120 },
            });
            return (
              <div
                key={card.label}
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  background: palette.panelSoft,
                  border: `1px solid ${palette.frame}`,
                  opacity: mediaIntro,
                  transform: `translateY(${(1 - mediaIntro) * 18}px)`,
                  boxShadow: palette.shadow,
                }}
              >
                <div style={{ height: 170, position: "relative" }}>
                  <Img src={card.imageSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: palette.imageOverlay }} />
                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      padding: "8px 10px",
                      borderRadius: 999,
                      background: palette.chipBackground,
                      border: `1px solid ${palette.border}`,
                      fontSize: 13,
                      letterSpacing: 0,
                    }}
                  >
                    {card.label}
                  </div>
                </div>
                <div style={{ padding: "14px 14px 16px", fontSize: 18, lineHeight: 1.42, color: palette.textSecondary, ...clampLines(3) }}>
                  {card.caption}
                </div>
              </div>
            );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
        {tags.map((tag) => (
          <div
            key={tag}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: `1px solid ${palette.borderStrong}`,
              background: palette.panel,
              fontSize: 18,
              color: palette.textMuted,
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
