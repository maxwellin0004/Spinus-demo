import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { getTradingScenePalette, type TradingSceneVariant } from "./tradingSceneTheme";

type TradingChartCaseSceneProps = {
  badge: string;
  title: string;
  takeaway: string;
  bullets: readonly string[];
  imageSrc?: string;
  variant?: TradingSceneVariant;
};

const clampLines = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export const TradingChartCaseScene: React.FC<TradingChartCaseSceneProps> = ({
  badge,
  title,
  takeaway,
  bullets,
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
        background: variant === "light" ? "linear-gradient(180deg, #fbfdff 0%, #edf4fb 100%)" : "linear-gradient(180deg, #090c14 0%, #04060b 100%)",
        color: palette.textPrimary,
        fontFamily: THEME.fonts.bodyZh,
        padding: "74px 72px",
      }}
    >
      <div style={{ display: "grid", gridTemplateRows: "520px 1fr", gap: 28, height: "100%" }}>
        <div
          style={{
            borderRadius: 26,
            overflow: "hidden",
            border: `1px solid ${palette.borderStrong}`,
            position: "relative",
            boxShadow: palette.shadow,
          }}
        >
          {imageSrc ? <Img src={imageSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: palette.imageOverlay,
            }}
          />
        </div>
        <div
          style={{
            borderRadius: 26,
            border: `1px solid ${palette.borderStrong}`,
            background: palette.panel,
            padding: "30px 30px 28px",
            transform: `translateY(${(1 - intro) * 28}px)`,
            opacity: intro,
          }}
        >
          <div style={{ fontSize: 20, letterSpacing: 0, color: palette.accent, marginBottom: 14 }}>{badge}</div>
          <div style={{ fontFamily: THEME.fonts.headlineZh, fontWeight: 700, fontSize: 58, lineHeight: 1.08, marginBottom: 16, ...clampLines(2) }}>
            {title}
          </div>
          <div style={{ fontSize: 26, lineHeight: 1.42, color: palette.textSecondary, marginBottom: 24, ...clampLines(3) }}>{takeaway}</div>
          <div style={{ display: "grid", gap: 12 }}>
            {bullets.map((bullet, index) => {
              const bulletIntro = spring({ fps, frame: frame - index * 5, config: { damping: 15, stiffness: 120 } });
              return (
                <div
                  key={bullet}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "22px 1fr",
                    gap: 12,
                    alignItems: "start",
                    opacity: bulletIntro,
                    transform: `translateX(${(1 - bulletIntro) * 16}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      marginTop: 10,
                      borderRadius: 999,
                      background: palette.accentStrong,
                      boxShadow: variant === "light" ? "0 0 18px rgba(47,125,246,0.24)" : "0 0 18px rgba(255,108,74,0.42)",
                    }}
                  />
                  <div style={{ fontSize: 24, lineHeight: 1.38, ...clampLines(2) }}>{bullet}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
