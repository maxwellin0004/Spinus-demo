import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { ReferencePalette, withPalette } from "../../lib/referencePalette";
import { THEME } from "../../theme/tokens";

type FlowStep = {
  title: string;
  body: string;
};

type ReferenceFlowSceneProps = {
  title: string;
  steps: readonly FlowStep[];
  palette?: Partial<ReferencePalette>;
};

export const ReferenceFlowScene: React.FC<ReferenceFlowSceneProps> = ({
  title,
  steps,
  palette,
}) => {
  const currentPalette = withPalette(palette);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneFrame palette={currentPalette}>
      <AbsoluteFill style={{ justifyContent: "center", gap: 34 }}>
        <div
          style={{
            color: currentPalette.textPrimary,
            fontFamily: THEME.fonts.headlineZh,
            fontWeight: 800,
            fontSize: 68,
            lineHeight: 1.05,
            maxWidth: 1260,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "stretch", gap: 18 }}>
          {steps.map((step, index) => {
            const reveal = spring({
              fps,
              frame: frame - index * 6,
              config: { damping: 17, stiffness: 120 },
            });
            return (
              <div
                key={step.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    borderRadius: 28,
                    border: `1px solid ${currentPalette.frame}`,
                    background: "rgba(255,255,255,0.04)",
                    padding: "26px 22px",
                    transform: `translateY(${(1 - reveal) * 18}px)`,
                    opacity: 0.45 + reveal * 0.55,
                  }}
                >
                  <div
                    style={{
                      color: currentPalette.accent,
                      fontFamily: THEME.fonts.ui,
                      fontSize: 18,
                      letterSpacing: 1.1,
                      marginBottom: 12,
                    }}
                  >
                    STEP 0{index + 1}
                  </div>
                  <div
                    style={{
                      color: currentPalette.textPrimary,
                      fontFamily: THEME.fonts.headlineZh,
                      fontSize: 34,
                      lineHeight: 1.14,
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      color: currentPalette.textMuted,
                      fontFamily: THEME.fonts.bodyZh,
                      fontSize: 23,
                      lineHeight: 1.42,
                    }}
                  >
                    {step.body}
                  </div>
                </div>
                {index < steps.length - 1 ? (
                  <div
                    style={{
                      width: 50,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: currentPalette.accent,
                      fontFamily: THEME.fonts.numbers,
                      fontSize: 42,
                    }}
                  >
                    →
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
