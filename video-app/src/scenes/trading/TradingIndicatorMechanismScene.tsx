import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { getTradingScenePalette, type TradingSceneVariant } from "./tradingSceneTheme";

type MechanismCard = {
  title: string;
  body: string;
};

type TradingIndicatorMechanismSceneProps = {
  tag: string;
  title: string;
  formula: string;
  description: string;
  cards: readonly MechanismCard[];
  imageSrc?: string;
  variant?: TradingSceneVariant;
};

const clampLines = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export const TradingIndicatorMechanismScene: React.FC<TradingIndicatorMechanismSceneProps> = ({
  tag,
  title,
  formula,
  description,
  cards,
  imageSrc,
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
            ? "radial-gradient(circle at top right, rgba(47,125,246,0.14), transparent 24%), linear-gradient(180deg, #fbfcff 0%, #eef4fb 100%)"
            : "radial-gradient(circle at top right, rgba(255,171,64,0.16), transparent 24%), linear-gradient(180deg, #080b12 0%, #05070d 100%)",
        color: palette.textPrimary,
        fontFamily: THEME.fonts.bodyZh,
        padding: "74px 72px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gap: 22 }}>
        <div>
          <div style={{ color: palette.accent, fontSize: 21, letterSpacing: 0, marginBottom: 14 }}>{tag}</div>
          <div
            style={{
              fontFamily: THEME.fonts.headlineZh,
              fontWeight: 700,
              fontSize: 62,
              lineHeight: 1.08,
              marginBottom: 16,
              ...clampLines(2),
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "inline-block",
              padding: "14px 20px",
              borderRadius: 18,
              border: `1px solid ${variant === "light" ? "rgba(47,125,246,0.28)" : "rgba(255,176,77,0.42)"}`,
              fontFamily: THEME.fonts.numbers,
              fontSize: 24,
              marginBottom: 18,
              background: palette.accentSoft,
              maxWidth: "100%",
              overflow: "hidden",
            }}
          >
            {formula}
          </div>
          <div style={{ fontSize: 27, lineHeight: 1.42, color: palette.textSecondary, ...clampLines(3) }}>{description}</div>
        </div>
        {imageSrc ? (
          <div
            style={{
              width: "100%",
              height: 300,
              borderRadius: 24,
              overflow: "hidden",
              border: `1px solid ${palette.borderStrong}`,
              boxShadow: palette.shadow,
            }}
          >
            <Img src={imageSrc} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: variant === "light" ? 0.88 : 0.92 }} />
          </div>
        ) : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18, marginTop: 28 }}>
        {cards.map((card, index) => {
          const cardIntro = spring({ fps, frame: frame - index * 6, config: { damping: 16, stiffness: 130 } });
          return (
            <div
              key={card.title}
              style={{
                borderRadius: 22,
                border: `1px solid ${palette.border}`,
                padding: "22px 20px",
                background: palette.panelSoft,
                transform: `translateY(${(1 - cardIntro) * 36}px)`,
                opacity: cardIntro,
                minHeight: 158,
              }}
            >
              <div style={{ fontSize: 25, fontWeight: 700, marginBottom: 10, color: palette.accent, ...clampLines(1) }}>{card.title}</div>
              <div style={{ fontSize: 22, lineHeight: 1.42, color: palette.textSecondary, ...clampLines(3) }}>{card.body}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 22,
          borderRadius: 28,
          border: `1px solid ${palette.frame}`,
          opacity: 0.8 * intro,
        }}
      />
    </AbsoluteFill>
  );
};
