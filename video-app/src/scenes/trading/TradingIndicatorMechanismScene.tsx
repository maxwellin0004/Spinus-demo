import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { getTradingScenePalette, type TradingSceneVariant } from "./tradingSceneTheme";
import { TradingImageFrame } from "./TradingImageFrame";

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

const AbstractSignalPanel: React.FC<{ variant: TradingSceneVariant }> = ({ variant }) => {
  const palette = getTradingScenePalette(variant);
  const candles = [38, 52, 44, 68, 58, 82, 64, 48, 42, 56, 50, 72, 62, 46];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background:
          variant === "light"
            ? "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(232,240,250,0.86))"
            : "linear-gradient(180deg, rgba(10,14,22,0.92), rgba(3,5,10,0.96))",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 52px",
          opacity: variant === "light" ? 0.28 : 0.36,
        }}
      />
      <svg viewBox="0 0 900 260" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path
          d="M32 178 C120 138 166 166 232 120 C300 72 352 116 420 96 C500 72 554 134 626 110 C702 86 768 128 866 74"
          fill="none"
          stroke={palette.accentStrong}
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M34 196 C146 156 198 190 278 150 C366 104 438 132 520 118 C620 96 690 158 866 122"
          fill="none"
          stroke={variant === "light" ? "rgba(47,125,246,0.42)" : "rgba(255,255,255,0.22)"}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          bottom: 34,
          height: 76,
          display: "flex",
          alignItems: "flex-end",
          gap: 22,
        }}
      >
        {candles.map((height, index) => (
          <div
            key={`${height}-${index}`}
            style={{
              width: 18,
              height,
              borderRadius: 999,
              background: index % 3 === 0 ? "#ff6c4a" : "#10b981",
              opacity: 0.82,
              boxShadow: index % 3 === 0 ? "0 0 22px rgba(255,108,74,0.25)" : "0 0 22px rgba(16,185,129,0.22)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

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
          {tag ? <div style={{ color: palette.accent, fontSize: 21, letterSpacing: 0, marginBottom: 14 }}>{tag}</div> : null}
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
          {imageSrc ? (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <TradingImageFrame src={imageSrc} opacity={variant === "light" ? 0.88 : 0.92} />
            </div>
          ) : (
            <AbstractSignalPanel variant={variant} />
          )}
        </div>
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
