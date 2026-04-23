import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { ReferencePalette, withPalette } from "../../lib/referencePalette";
import { THEME } from "../../theme/tokens";

type DocCard = {
  title: string;
  description: string;
};

type ReferenceDocSceneProps = {
  path: string;
  filename: string;
  headline: string;
  cards: readonly DocCard[];
  palette?: Partial<ReferencePalette>;
};

export const ReferenceDocScene: React.FC<ReferenceDocSceneProps> = ({
  path,
  filename,
  headline,
  cards,
  palette,
}) => {
  const currentPalette = withPalette(palette);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mainReveal = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 120 },
  });

  return (
    <SceneFrame palette={currentPalette}>
      <AbsoluteFill style={{ justifyContent: "center", gap: 28 }}>
        <div
          style={{
            alignSelf: "flex-start",
            border: `1px solid ${currentPalette.frame}`,
            borderRadius: 16,
            padding: "10px 16px",
            color: currentPalette.textMuted,
            fontFamily: THEME.fonts.ui,
            fontSize: 18,
            letterSpacing: 0.6,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          path: {path}
        </div>
        <div
          style={{
            color: currentPalette.textPrimary,
            fontFamily: THEME.fonts.headlineZh,
            fontSize: 72,
            lineHeight: 1.04,
            fontWeight: 800,
            maxWidth: 1240,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "540px 1fr",
            gap: 28,
            alignItems: "stretch",
            flex: 1,
          }}
        >
          <div
            style={{
              borderRadius: 38,
              border: `1px solid ${currentPalette.frame}`,
              background:
                `linear-gradient(180deg, rgba(${currentPalette.accentRgb},0.16), rgba(255,255,255,0.03))`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 22,
              transform: `translateX(${(1 - mainReveal) * -50}px) scale(${0.92 + mainReveal * 0.08})`,
              boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                width: 190,
                height: 220,
                borderRadius: 28,
                background: currentPalette.accent,
                position: "relative",
                boxShadow: `0 20px 60px rgba(${currentPalette.accentRgb},0.24)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 54,
                  height: 54,
                  background: "#0d0f16",
                  clipPath: "polygon(0 0, 100% 0, 100% 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  top: 56,
                  width: 108,
                  height: 18,
                  borderRadius: 999,
                  background: "#0d0f16",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  top: 98,
                  width: 82,
                  height: 18,
                  borderRadius: 999,
                  background: "#0d0f16",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  top: 140,
                  width: 108,
                  height: 18,
                  borderRadius: 999,
                  background: "#0d0f16",
                }}
              />
            </div>
            <div
              style={{
                color: currentPalette.textPrimary,
                fontFamily: THEME.fonts.headlineEn,
                fontSize: 56,
                letterSpacing: 2,
              }}
            >
              {filename}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
            }}
          >
            {cards.map((card, index) => {
              const itemReveal = spring({
                fps,
                frame: frame - index * 6,
                config: { damping: 16, stiffness: 130 },
              });

              return (
                <div
                  key={card.title}
                  style={{
                    borderRadius: 28,
                    border: `1px solid rgba(${currentPalette.accentRgb},${0.14 + index * 0.04})`,
                    background: "rgba(255,255,255,0.04)",
                    padding: "24px 22px",
                    transform: `translateY(${(1 - itemReveal) * 24}px)`,
                    opacity: itemReveal,
                  }}
                >
                  <div
                    style={{
                      color: currentPalette.accent,
                      fontFamily: THEME.fonts.ui,
                      fontSize: 18,
                      marginBottom: 12,
                      letterSpacing: 1.2,
                    }}
                  >
                    0{index + 1}
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
                    {card.title}
                  </div>
                  <div
                    style={{
                      color: currentPalette.textMuted,
                      fontFamily: THEME.fonts.bodyZh,
                      fontSize: 24,
                      lineHeight: 1.42,
                    }}
                  >
                    {card.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
