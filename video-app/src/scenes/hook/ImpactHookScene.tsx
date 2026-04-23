import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { HeadlineBlock } from "../../components/HeadlineBlock";
import { SceneFrame } from "../../components/SceneFrame";
import { highlightText } from "../../lib/highlightText";
import { THEME } from "../../theme/tokens";

type ImpactHookSceneProps = {
  eyebrow?: string;
  headline: string;
  supportingText?: string;
  accentWords?: readonly string[];
  rightPanelTitle?: string;
  rightPanelLines?: readonly string[];
};

export const ImpactHookScene: React.FC<ImpactHookSceneProps> = ({
  eyebrow,
  headline,
  supportingText,
  accentWords = [],
  rightPanelTitle,
  rightPanelLines = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const panelScale = spring({
    fps,
    frame,
    config: {
      damping: 18,
      stiffness: 120,
    },
  });

  return (
    <SceneFrame>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          flexDirection: "row",
          alignItems: "center",
          gap: 72,
        }}
      >
        <div style={{ flex: 1 }}>
          <HeadlineBlock
            eyebrow={eyebrow}
            headline={highlightText(headline, accentWords)}
            supportingText={supportingText}
            align="left"
          />
        </div>
        <div
          style={{
            flex: 0.8,
            alignSelf: "stretch",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${0.92 + panelScale * 0.08})`,
          }}
        >
          <div
            style={{
              width: "100%",
              border: `1px solid ${THEME.colors.frame}`,
              borderRadius: 36,
              padding: "36px 34px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            {rightPanelTitle ? (
              <div
                style={{
                  color: THEME.colors.accent,
                  fontFamily: THEME.fonts.ui,
                  fontSize: 22,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  marginBottom: 18,
                }}
              >
                {rightPanelTitle}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {rightPanelLines.map((line, index) => (
                <div
                  key={`${line}-${index}`}
                  style={{
                    color:
                      index === 1
                        ? THEME.colors.textPrimary
                        : THEME.colors.textMuted,
                    fontFamily: THEME.fonts.bodyZh,
                    fontSize: index === 1 ? 36 : 28,
                    lineHeight: 1.35,
                    fontWeight: index === 1 ? 700 : 500,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 96,
            bottom: 112,
            color: THEME.colors.textMuted,
            fontFamily: THEME.fonts.ui,
            fontSize: 22,
            maxWidth: 420,
            lineHeight: 1.35,
          }}
        >
          Hook scene: conflict first, outcome visible, UI panel reinforces what a
          skill actually stores.
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
