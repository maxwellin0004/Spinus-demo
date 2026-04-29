import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { getTradingScenePalette, type TradingSceneVariant } from "./tradingSceneTheme";

type TradingCaseShockSceneProps = {
  kicker: string;
  headline: string;
  subheadline: string;
  stat: string;
  statLabel: string;
  dateLabel: string;
  imageSrc?: string;
  insetImageSrc?: string;
  sourceLabel?: string;
  boardLines?: readonly string[];
  variant?: TradingSceneVariant;
};

const clampLines = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export const TradingCaseShockScene: React.FC<TradingCaseShockSceneProps> = ({
  kicker,
  headline,
  subheadline,
  stat,
  statLabel,
  dateLabel,
  imageSrc,
  insetImageSrc,
  sourceLabel,
  boardLines,
  variant = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ fps, frame, config: { damping: 16, stiffness: 120 } });
  const statIntro = spring({ fps, frame: frame - 10, config: { damping: 18, stiffness: 140 } });
  const palette = getTradingScenePalette(variant);

  return (
    <AbsoluteFill
      style={{
        background:
          variant === "light"
            ? "radial-gradient(circle at 15% 15%, rgba(47,125,246,0.18), transparent 28%), linear-gradient(180deg, #f9fbff 0%, #edf3fb 62%, #e6eef8 100%)"
            : "radial-gradient(circle at 15% 15%, rgba(255,102,64,0.22), transparent 28%), linear-gradient(180deg, #140607 0%, #07090f 62%, #020305 100%)",
        color: palette.textPrimary,
        fontFamily: THEME.fonts.bodyZh,
        overflow: "hidden",
      }}
    >
      {imageSrc ? (
        <Img
          src={imageSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: variant === "light" ? 0.22 : 0.28,
            transform: `scale(${1.06 - intro * 0.06})`,
            filter:
              variant === "light"
                ? "saturate(0.82) contrast(1.04) brightness(0.94)"
                : "saturate(0.85) contrast(1.05) brightness(0.72)",
          }}
        />
      ) : null}
      {!imageSrc && boardLines ? (
        <div
          style={{
            position: "absolute",
            right: 66,
            top: 640,
            width: 360,
            padding: "22px 20px 26px",
            borderRadius: 18,
            background: "#ece8de",
            color: "#111",
            transform: `rotate(-3deg) scale(${0.96 + intro * 0.04})`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
            border: "6px solid #dad3c6",
            opacity: 0.2,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: 0,
              color: "#5e5c55",
              marginBottom: 20,
              textTransform: "uppercase",
            }}
          >
            Market Extra
          </div>
          {boardLines.map((line) => (
            <div
              key={line}
              style={{
                fontFamily: THEME.fonts.headlineEn,
                fontSize: 50,
                lineHeight: 0.92,
                marginBottom: 6,
                letterSpacing: 0,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: palette.overlay }} />
      <div
        style={{
          position: "absolute",
          inset: 20,
          border: `1px solid ${palette.border}`,
          borderRadius: 28,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 72,
          left: 72,
          display: "flex",
          alignItems: "center",
          gap: 12,
          letterSpacing: 0,
          textTransform: "uppercase",
          fontSize: 20,
          color: palette.textMuted,
        }}
      >
        <div style={{ width: 44, height: 2, background: palette.accentStrong }} />
        <span>{kicker}</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 132,
          width: 910,
          transform: `translateY(${interpolate(intro, [0, 1], [12, 0])}px)`,
          opacity: Math.max(0.82, intro),
        }}
      >
        <div
          style={{
            fontFamily: THEME.fonts.headlineZh,
            fontWeight: 700,
            fontSize: 74,
            lineHeight: 1.06,
            letterSpacing: 0,
            marginBottom: 18,
            ...clampLines(2),
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 30,
            lineHeight: 1.45,
            color: palette.textSecondary,
            maxWidth: 850,
            ...clampLines(3),
          }}
        >
          {subheadline}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 112,
          width: 640,
          padding: "24px 26px 26px",
          borderRadius: 24,
          background: palette.panelSolid,
          border: `1px solid ${variant === "light" ? "rgba(47,125,246,0.28)" : "rgba(255,108,74,0.35)"}`,
          backdropFilter: "blur(10px)",
          transform: `translateY(${interpolate(statIntro, [0, 1], [30, 0])}px)`,
          opacity: statIntro,
          boxShadow: palette.shadow,
        }}
      >
        {insetImageSrc ? (
          <div
            style={{
              height: 150,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 18,
              border: `1px solid ${palette.border}`,
              position: "relative",
            }}
          >
            <Img src={insetImageSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: palette.imageOverlay }} />
          </div>
        ) : null}
        <div
          style={{
            fontFamily: THEME.fonts.numbers,
            fontSize: 66,
            lineHeight: 1,
            color: palette.accentStrong,
            marginBottom: 12,
          }}
        >
          {stat}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.32, marginBottom: 14, ...clampLines(2) }}>{statLabel}</div>
        <div style={{ fontSize: 21, color: palette.textMuted, ...clampLines(1) }}>{dateLabel}</div>
        {sourceLabel ? (
          <div
            style={{
              marginTop: 14,
              fontSize: 18,
              letterSpacing: 0,
              color: palette.textMuted,
              ...clampLines(1),
            }}
          >
            {sourceLabel}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
