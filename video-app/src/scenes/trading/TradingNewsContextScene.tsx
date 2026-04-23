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
        padding: "84px 88px",
      }}
    >
      <div style={{ color: palette.accent, fontSize: 24, letterSpacing: 2, marginBottom: 18 }}>{kicker}</div>
      <div
        style={{
          width: 1180,
          fontFamily: THEME.fonts.headlineZh,
          fontWeight: 700,
          fontSize: 74,
          lineHeight: 1.06,
          marginBottom: 28,
          opacity: intro,
          transform: `translateY(${(1 - intro) * 20}px)`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: 1260,
          padding: "28px 30px",
          borderRadius: 28,
          background: palette.panel,
          border: `1px solid ${palette.border}`,
          fontSize: 34,
          lineHeight: 1.5,
          color: palette.textSecondary,
          marginBottom: 34,
          boxShadow: palette.shadow,
        }}
      >
        “{quote}”
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 28, marginBottom: 30 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
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
                  borderRadius: 24,
                  overflow: "hidden",
                  background: palette.panelSoft,
                  border: `1px solid ${palette.frame}`,
                  opacity: mediaIntro,
                  transform: `translateY(${(1 - mediaIntro) * 18}px)`,
                  boxShadow: palette.shadow,
                }}
              >
                <div style={{ height: 220, position: "relative" }}>
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
                      fontSize: 15,
                      letterSpacing: 1,
                    }}
                  >
                    {card.label}
                  </div>
                </div>
                <div style={{ padding: "16px 16px 18px", fontSize: 21, lineHeight: 1.45, color: palette.textSecondary }}>
                  {card.caption}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gap: 18 }}>
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
                  borderRadius: 24,
                  padding: "24px 22px",
                  background: palette.panelSoft,
                  border: `1px solid ${palette.frame}`,
                  minHeight: 126,
                  opacity: itemIntro,
                  transform: `translateY(${(1 - itemIntro) * 20}px)`,
                }}
              >
                <div style={{ color: palette.accentStrong, fontFamily: THEME.fonts.numbers, fontSize: 22, marginBottom: 12 }}>
                  0{index + 1}
                </div>
                <div style={{ fontSize: 28, lineHeight: 1.45, color: palette.textPrimary }}>{bullet}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 30 }}>
        {tags.map((tag) => (
          <div
            key={tag}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: `1px solid ${palette.borderStrong}`,
              background: palette.panel,
              fontSize: 20,
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
