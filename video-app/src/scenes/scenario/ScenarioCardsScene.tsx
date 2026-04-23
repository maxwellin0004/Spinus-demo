import { AbsoluteFill, Img } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { THEME } from "../../theme/tokens";

type ScenarioCard = {
  title: string;
  description: string;
  imageSrc: string;
};

type ScenarioCardsSceneProps = {
  eyebrow: string;
  headline: string;
  cards: readonly ScenarioCard[];
};

export const ScenarioCardsScene: React.FC<ScenarioCardsSceneProps> = ({
  eyebrow,
  headline,
  cards,
}) => {
  return (
    <SceneFrame>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          gap: 34,
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
            fontSize: 76,
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
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 24,
          }}
        >
          {cards.map((card) => (
            <div
              key={card.title}
              style={{
                border: `1px solid ${THEME.colors.frame}`,
                borderRadius: 30,
                overflow: "hidden",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
              }}
            >
              <div
                style={{
                  height: 250,
                  overflow: "hidden",
                  borderBottom: `1px solid ${THEME.colors.frame}`,
                }}
              >
                <Img
                  src={card.imageSrc}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div style={{ padding: "22px 22px 24px" }}>
                <div
                  style={{
                    color: THEME.colors.textPrimary,
                    fontSize: 34,
                    lineHeight: 1.18,
                    fontWeight: 700,
                    marginBottom: 12,
                    fontFamily: THEME.fonts.headlineZh,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    color: THEME.colors.textMuted,
                    fontSize: 24,
                    lineHeight: 1.4,
                    fontFamily: THEME.fonts.bodyZh,
                  }}
                >
                  {card.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
