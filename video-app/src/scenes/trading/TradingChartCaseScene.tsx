import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { getTradingScenePalette, type TradingSceneVariant } from "./tradingSceneTheme";
import { TradingImageFrame } from "./TradingImageFrame";

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

const AbstractCaseChart: React.FC<{ variant: TradingSceneVariant }> = ({ variant }) => {
  const palette = getTradingScenePalette(variant);
  const bars = [42, 58, 46, 72, 62, 84, 66, 50, 44, 60, 52, 70];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          variant === "light"
            ? "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(229,238,249,0.92))"
            : "linear-gradient(180deg, rgba(8,11,18,0.96), rgba(3,5,10,0.98))",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "70px 52px",
          opacity: variant === "light" ? 0.26 : 0.34,
        }}
      />
      <svg viewBox="0 0 900 520" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path
          d="M42 354 C128 290 184 316 246 232 C310 146 374 204 444 174 C510 146 570 196 636 158 C716 112 778 160 858 96"
          fill="none"
          stroke={palette.accentStrong}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M42 380 C144 324 214 366 304 302 C392 238 466 264 542 234 C640 196 718 260 858 210"
          fill="none"
          stroke={variant === "light" ? "rgba(47,125,246,0.42)" : "rgba(255,255,255,0.22)"}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 88,
          right: 88,
          bottom: 54,
          height: 110,
          display: "flex",
          alignItems: "flex-end",
          gap: 26,
        }}
      >
        {bars.map((height, index) => (
          <div
            key={`${height}-${index}`}
            style={{
              width: 20,
              height,
              borderRadius: 999,
              background: index % 4 === 0 ? "#ff6c4a" : "#10b981",
              opacity: 0.82,
            }}
          />
        ))}
      </div>
    </div>
  );
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
  const { fps, width, height } = useVideoConfig();
  const intro = spring({ fps, frame, config: { damping: 18, stiffness: 120 } });
  const palette = getTradingScenePalette(variant);
  const isVertical = height > width;
  const scenePadding = isVertical ? "64px 62px 250px" : "74px 72px";
  const imageHeight = isVertical ? 740 : 520;
  const contentGap = isVertical ? 18 : 28;
  const cardPadding = isVertical ? "26px 28px 28px" : "30px 30px 28px";
  const titleSize = isVertical ? 54 : 58;
  const takeawaySize = isVertical ? 25 : 26;
  const bulletSize = isVertical ? 23 : 24;

  return (
    <AbsoluteFill
      style={{
        background: variant === "light" ? "linear-gradient(180deg, #fbfdff 0%, #edf4fb 100%)" : "linear-gradient(180deg, #090c14 0%, #04060b 100%)",
        color: palette.textPrimary,
        fontFamily: THEME.fonts.bodyZh,
        padding: scenePadding,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gridTemplateRows: `${imageHeight}px auto`, gap: contentGap }}>
        <div
          style={{
            borderRadius: 26,
            overflow: "hidden",
            border: `1px solid ${palette.borderStrong}`,
            position: "relative",
            boxShadow: palette.shadow,
          }}
        >
          {imageSrc ? <TradingImageFrame src={imageSrc} /> : <AbstractCaseChart variant={variant} />}
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
            padding: cardPadding,
            transform: `translateY(${(1 - intro) * 28}px)`,
            opacity: intro,
            alignSelf: "start",
          }}
        >
          <div style={{ fontSize: 20, letterSpacing: 0, color: palette.accent, marginBottom: 14 }}>{badge}</div>
          <div style={{ fontFamily: THEME.fonts.headlineZh, fontWeight: 700, fontSize: titleSize, lineHeight: 1.08, marginBottom: 14, ...clampLines(2) }}>
            {title}
          </div>
          <div style={{ fontSize: takeawaySize, lineHeight: 1.38, color: palette.textSecondary, marginBottom: 20, ...clampLines(2) }}>{takeaway}</div>
          <div style={{ display: "grid", gap: 11 }}>
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
                  <div style={{ fontSize: bulletSize, lineHeight: 1.32, ...clampLines(2) }}>{bullet}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
