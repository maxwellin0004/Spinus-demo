import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { ReferencePalette, withPalette } from "../../lib/referencePalette";
import { THEME } from "../../theme/tokens";

type ReferenceScenarioSceneProps = {
  badge: string;
  title: string;
  description: string;
  bullets: readonly string[];
  imageSrc: string;
  palette?: Partial<ReferencePalette>;
};

export const ReferenceScenarioScene: React.FC<ReferenceScenarioSceneProps> = ({
  badge,
  title,
  description,
  bullets,
  imageSrc,
  palette,
}) => {
  const currentPalette = withPalette(palette);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: { damping: 16, stiffness: 120 },
  });

  return (
    <SceneFrame palette={currentPalette}>
      <AbsoluteFill style={{ justifyContent: "center", gap: 24 }}>
        <div
          style={{
            alignSelf: "flex-start",
            border: `1px solid ${currentPalette.frame}`,
            borderRadius: 14,
            padding: "12px 18px",
            color: currentPalette.accent,
            fontFamily: THEME.fonts.ui,
            fontSize: 18,
            letterSpacing: 1.1,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {badge}
        </div>
        <div
          style={{
            color: currentPalette.textPrimary,
            fontFamily: THEME.fonts.headlineZh,
            fontSize: 72,
            lineHeight: 1.04,
            fontWeight: 800,
            maxWidth: 1180,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 24,
            flex: 1,
          }}
        >
          <div
            style={{
              borderRadius: 32,
              border: `1px solid ${currentPalette.frame}`,
              overflow: "hidden",
              transform: `translateY(${(1 - reveal) * 24}px)`,
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            }}
          >
            <Img
              src={imageSrc}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              borderRadius: 32,
              border: `1px solid rgba(${currentPalette.accentRgb},0.18)`,
              background: "rgba(255,255,255,0.04)",
              padding: "26px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                color: currentPalette.textMuted,
                fontFamily: THEME.fonts.bodyZh,
                fontSize: 25,
                lineHeight: 1.44,
              }}
            >
              {description}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {bullets.map((bullet, index) => (
                <div
                  key={bullet}
                  style={{
                    borderRadius: 20,
                    padding: "16px 18px",
                    border: `1px solid rgba(${currentPalette.accentRgb},${0.12 + index * 0.03})`,
                    background: "rgba(255,255,255,0.025)",
                  }}
                >
                  <div
                    style={{
                      color: currentPalette.textPrimary,
                      fontFamily: THEME.fonts.bodyZh,
                      fontSize: 24,
                      lineHeight: 1.38,
                    }}
                  >
                    {bullet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
