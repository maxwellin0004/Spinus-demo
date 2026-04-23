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
        padding: "88px 92px",
      }}
    >
      <div style={{ fontSize: 22, letterSpacing: 2, color: palette.accent, marginBottom: 18 }}>实战判断顺序</div>
      <div style={{ fontFamily: THEME.fonts.headlineZh, fontWeight: 700, fontSize: 70, lineHeight: 1.06, width: 1180, marginBottom: 16 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, lineHeight: 1.5, color: palette.textMuted, width: 1060, marginBottom: 42 }}>{subtitle}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 28 }}>
        {steps.map((step, index) => {
          const intro = spring({ fps, frame: frame - index * 8, config: { damping: 16, stiffness: 125 } });
          return (
            <div
              key={step.title}
              style={{
                borderRadius: 30,
                border: `1px solid ${palette.borderStrong}`,
                background: palette.panel,
                padding: "28px 26px 32px",
                minHeight: 360,
                opacity: intro,
                transform: `translateY(${(1 - intro) * 28}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: THEME.fonts.numbers,
                  fontSize: 26,
                  color: palette.accentStrong,
                  marginBottom: 14,
                }}
              >
                0{index + 1}
              </div>
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}>{step.title}</div>
              <div style={{ fontSize: 25, lineHeight: 1.55, color: palette.textSecondary }}>{step.body}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
