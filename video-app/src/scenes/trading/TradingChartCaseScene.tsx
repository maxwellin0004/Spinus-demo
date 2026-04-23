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
        padding: "84px 88px",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 34, height: "100%" }}>
        <div
          style={{
            borderRadius: 30,
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
            borderRadius: 30,
            border: `1px solid ${palette.borderStrong}`,
            background: palette.panel,
            padding: "34px 34px 28px",
            transform: `translateY(${(1 - intro) * 28}px)`,
            opacity: intro,
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 2, color: palette.accent, marginBottom: 18 }}>{badge}</div>
          <div style={{ fontFamily: THEME.fonts.headlineZh, fontWeight: 700, fontSize: 62, lineHeight: 1.06, marginBottom: 18 }}>
            {title}
          </div>
          <div style={{ fontSize: 27, lineHeight: 1.55, color: palette.textSecondary, marginBottom: 28 }}>{takeaway}</div>
          <div style={{ display: "grid", gap: 14 }}>
            {bullets.map((bullet, index) => {
              const bulletIntro = spring({ fps, frame: frame - index * 5, config: { damping: 15, stiffness: 120 } });
              return (
                <div
                  key={bullet}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "26px 1fr",
                    gap: 14,
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
                  <div style={{ fontSize: 25, lineHeight: 1.45 }}>{bullet}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
