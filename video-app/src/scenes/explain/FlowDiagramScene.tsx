import { AbsoluteFill } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { THEME } from "../../theme/tokens";

type FlowDiagramSceneProps = {
  eyebrow: string;
  headline: string;
  steps: readonly string[];
  footer: string;
};

export const FlowDiagramScene: React.FC<FlowDiagramSceneProps> = ({
  eyebrow,
  headline,
  steps,
  footer,
}) => {
  return (
    <SceneFrame>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            color: THEME.colors.accent,
            fontSize: 24,
            letterSpacing: 1.3,
            textTransform: "uppercase",
            fontWeight: 700,
            fontFamily: THEME.fonts.ui,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            color: THEME.colors.textPrimary,
            fontSize: 78,
            lineHeight: 1.04,
            fontWeight: 800,
            maxWidth: 1240,
            fontFamily: THEME.fonts.headlineZh,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
            gap: 20,
            alignItems: "stretch",
          }}
        >
          {steps.map((step, index) => (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 16,
              }}
            >
              <div
                style={{
                  flex: 1,
                  border: `1px solid ${THEME.colors.frame}`,
                  borderRadius: 26,
                  padding: "24px 22px",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    color: THEME.colors.accent,
                    fontSize: 18,
                    marginBottom: 12,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    fontFamily: THEME.fonts.ui,
                  }}
                >
                  Step 0{index + 1}
                </div>
                <div
                  style={{
                    color: THEME.colors.textPrimary,
                    fontSize: 28,
                    lineHeight: 1.35,
                    fontFamily: THEME.fonts.bodyZh,
                  }}
                >
                  {step}
                </div>
              </div>
              {index < steps.length - 1 ? (
                <div
                  style={{
                    width: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: THEME.colors.accent,
                    fontSize: 34,
                    fontFamily: THEME.fonts.numbers,
                  }}
                >
                  →
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div
          style={{
            color: THEME.colors.textMuted,
            fontSize: 24,
            lineHeight: 1.4,
            fontFamily: THEME.fonts.bodyZh,
            maxWidth: 1200,
          }}
        >
          {footer}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
