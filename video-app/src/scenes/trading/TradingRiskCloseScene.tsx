import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { getTradingScenePalette, type TradingSceneVariant } from "./tradingSceneTheme";

type TradingRiskCloseSceneProps = {
  title: string;
  body: string;
  tags: readonly string[];
  variant?: TradingSceneVariant;
};

const clampLines = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export const TradingRiskCloseScene: React.FC<TradingRiskCloseSceneProps> = ({
  title,
  body,
  tags,
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
            ? "radial-gradient(circle at bottom, rgba(47,125,246,0.12), transparent 32%), linear-gradient(180deg, #fafdff 0%, #edf4fb 100%)"
            : "radial-gradient(circle at bottom, rgba(255,108,74,0.16), transparent 32%), linear-gradient(180deg, #05070d 0%, #030407 100%)",
        color: palette.textPrimary,
        fontFamily: THEME.fonts.bodyZh,
        padding: "86px 72px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 28,
          borderRadius: 34,
          border: `1px solid ${palette.border}`,
        }}
      />
      <div
        style={{
          width: "100%",
          margin: "0 auto",
          marginTop: 170,
          textAlign: "center",
          opacity: intro,
          transform: `translateY(${(1 - intro) * 26}px)`,
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 0, color: palette.accent, marginBottom: 18 }}>最后的边界</div>
        <div style={{ fontFamily: THEME.fonts.headlineZh, fontWeight: 700, fontSize: 66, lineHeight: 1.08, marginBottom: 22, ...clampLines(3) }}>
          {title}
        </div>
        <div style={{ fontSize: 29, lineHeight: 1.46, color: palette.textSecondary, marginBottom: 38, ...clampLines(3) }}>{body}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                border: `1px solid ${palette.borderStrong}`,
                background: palette.panel,
                fontSize: 21,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
