import { AbsoluteFill } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { THEME } from "../../theme/tokens";

type DefinitionSceneProps = {
  eyebrow?: string;
  term: string;
  definition: string;
  bullets: readonly string[];
};

export const DefinitionScene: React.FC<DefinitionSceneProps> = ({
  eyebrow = "Definition",
  term,
  definition,
  bullets,
}) => {
  return (
    <SceneFrame>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          gap: 40,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 0.95,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              color: THEME.colors.accent,
              fontSize: 24,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              fontFamily: THEME.fonts.ui,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              color: THEME.colors.textPrimary,
              fontSize: 116,
              lineHeight: 0.95,
              fontWeight: 800,
              fontFamily: THEME.fonts.headlineZh,
            }}
          >
            {term}
          </div>
          <div
            style={{
              color: THEME.colors.textPrimary,
              fontSize: 34,
              lineHeight: 1.35,
              maxWidth: 780,
              fontFamily: THEME.fonts.bodyZh,
            }}
          >
            {definition}
          </div>
        </div>
        <div
          style={{
            flex: 1.05,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 18,
          }}
        >
          {bullets.map((bullet, index) => (
            <div
              key={bullet}
              style={{
                border: `1px solid ${THEME.colors.frame}`,
                borderRadius: 28,
                padding: "22px 24px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div
                style={{
                  color: THEME.colors.accent,
                  fontSize: 18,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                  fontFamily: THEME.fonts.ui,
                }}
              >
                0{index + 1}
              </div>
              <div
                style={{
                  color: THEME.colors.textMuted,
                  fontSize: 28,
                  lineHeight: 1.35,
                  fontFamily: THEME.fonts.bodyZh,
                }}
              >
                {bullet}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
