import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { getTradingScenePalette, type TradingSceneVariant } from "./tradingSceneTheme";

type ChecklistStep = {
  title: string;
  body: string;
};

type TradingChecklistSceneProps = {
  title: string;
  subtitle: string;
  steps: readonly ChecklistStep[];
  variant?: TradingSceneVariant;
};

const clampLines = (lines: number) => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: lines,
  overflow: "hidden",
});

export const TradingChecklistScene: React.FC<TradingChecklistSceneProps> = ({
  title,
  subtitle,
  steps,
  variant = "dark",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = getTradingScenePalette(variant);

  return (
    <AbsoluteFill
      style={{
        background:
          variant === "light"
            ? "radial-gradient(circle at center, rgba(47,125,246,0.12), transparent 30%), linear-gradient(180deg, #fafdff 0%, #edf4fb 100%)"
            : "radial-gradient(circle at center, rgba(255,176,77,0.14), transparent 30%), linear-gradient(180deg, #070a10 0%, #05070d 100%)",
        color: palette.textPrimary,
        fontFamily: THEME.fonts.bodyZh,
        padding: "76px 72px",
      }}
    >
      <div style={{ fontSize: 20, letterSpacing: 0, color: palette.accent, marginBottom: 14 }}>实战判断顺序</div>
      <div style={{ fontFamily: THEME.fonts.headlineZh, fontWeight: 700, fontSize: 62, lineHeight: 1.08, width: "100%", marginBottom: 16, ...clampLines(2) }}>
        {title}
      </div>
      <div style={{ fontSize: 27, lineHeight: 1.42, color: palette.textMuted, width: "100%", marginBottom: 36, ...clampLines(2) }}>{subtitle}</div>
      <div style={{ display: "grid", gridTemplateRows: "repeat(3, minmax(0, 1fr))", gap: 22 }}>
        {steps.map((step, index) => {
          const intro = spring({ fps, frame: frame - index * 8, config: { damping: 16, stiffness: 125 } });
          return (
            <div
              key={step.title}
              style={{
                borderRadius: 26,
                border: `1px solid ${palette.borderStrong}`,
                background: palette.panel,
                padding: "26px 28px",
                minHeight: 218,
                opacity: intro,
                transform: `translateY(${(1 - intro) * 28}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: THEME.fonts.numbers,
                  fontSize: 24,
                  color: palette.accentStrong,
                  marginBottom: 12,
                }}
              >
                0{index + 1}
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2, marginBottom: 12, ...clampLines(1) }}>{step.title}</div>
              <div style={{ fontSize: 24, lineHeight: 1.42, color: palette.textSecondary, ...clampLines(2) }}>{step.body}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
