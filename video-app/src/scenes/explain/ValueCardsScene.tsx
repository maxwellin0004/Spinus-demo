import { AbsoluteFill } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { THEME } from "../../theme/tokens";

type ValueCard = {
  title: string;
  description: string;
};

type ValueCardsSceneProps = {
  eyebrow: string;
  headline: string;
  cards: readonly ValueCard[];
};

export const ValueCardsScene: React.FC<ValueCardsSceneProps> = ({
  eyebrow,
  headline,
  cards,
}) => {
  return (
    <SceneFrame>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          gap: 40,
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
            fontSize: 80,
            lineHeight: 1.02,
            fontWeight: 800,
            fontFamily: THEME.fonts.headlineZh,
            maxWidth: 1180,
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
          {cards.map((card, index) => (
            <div
              key={card.title}
              style={{
                border: `1px solid ${THEME.colors.frame}`,
                borderRadius: 30,
                padding: "28px 28px 30px",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                minHeight: 290,
              }}
            >
              <div
                style={{
                  color: THEME.colors.accent,
                  fontSize: 18,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  marginBottom: 18,
                  fontFamily: THEME.fonts.ui,
                }}
              >
                0{index + 1}
              </div>
              <div
                style={{
                  color: THEME.colors.textPrimary,
                  fontSize: 38,
                  lineHeight: 1.15,
                  fontWeight: 700,
                  marginBottom: 16,
                  fontFamily: THEME.fonts.headlineZh,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  color: THEME.colors.textMuted,
                  fontSize: 26,
                  lineHeight: 1.4,
                  fontFamily: THEME.fonts.bodyZh,
                }}
              >
                {card.description}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
