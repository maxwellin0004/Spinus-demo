import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { ReferencePalette, withPalette } from "../../lib/referencePalette";
import { THEME } from "../../theme/tokens";

type ReferenceCloseSceneProps = {
  headline: string;
  subheadline: string;
  palette?: Partial<ReferencePalette>;
};

export const ReferenceCloseScene: React.FC<ReferenceCloseSceneProps> = ({
  headline,
  subheadline,
  palette,
}) => {
  const currentPalette = withPalette(palette);
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <SceneFrame accentOpacity={0.1} palette={currentPalette}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 28,
          opacity,
        }}
      >
        <div
          style={{
            color: currentPalette.textPrimary,
            fontFamily: THEME.fonts.headlineZh,
            fontWeight: 800,
            fontSize: 88,
            lineHeight: 1.05,
            maxWidth: 1320,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: currentPalette.textMuted,
            fontFamily: THEME.fonts.bodyZh,
            fontSize: 31,
            lineHeight: 1.42,
            maxWidth: 1040,
          }}
        >
          {subheadline}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 20 }}>
          {new Array(5).fill(null).map((_, index) => (
            <div
              key={`file-${index}`}
              style={{
                width: 46,
                height: 56,
                borderRadius: 10,
                border: `1px solid rgba(${currentPalette.accentRgb},${0.18 + index * 0.08})`,
                background: `rgba(${currentPalette.accentRgb},0.08)`,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
