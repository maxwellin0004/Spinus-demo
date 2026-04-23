import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { ReferencePalette, withPalette } from "../../lib/referencePalette";
import { THEME } from "../../theme/tokens";

type ReferenceCompareSceneProps = {
  title?: string;
  leftTitle: string;
  rightTitle: string;
  leftPoints: readonly string[];
  rightPoints: readonly string[];
  footer: string;
  palette?: Partial<ReferencePalette>;
};

export const ReferenceCompareScene: React.FC<ReferenceCompareSceneProps> = ({
  title,
  leftTitle,
  rightTitle,
  leftPoints,
  rightPoints,
  footer,
  palette,
}) => {
  const currentPalette = withPalette(palette);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: { damping: 17, stiffness: 130 },
  });

  const renderPanel = (
    panelTitle: string,
    points: readonly string[],
    align: "left" | "right",
  ) => (
    <div
      style={{
        flex: 1,
        borderRadius: 30,
        border: `1px solid ${currentPalette.frame}`,
        background: "rgba(255,255,255,0.04)",
        padding: "30px 28px",
        transform: `translateX(${align === "left" ? (1 - reveal) * -40 : (1 - reveal) * 40}px)`,
        opacity: 0.4 + reveal * 0.6,
      }}
    >
      <div
        style={{
          color: currentPalette.textPrimary,
          fontFamily: THEME.fonts.headlineZh,
          fontWeight: 800,
          fontSize: 40,
          marginBottom: 18,
        }}
      >
        {panelTitle}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {points.map((point, index) => (
          <div
            key={point}
            style={{
              display: "grid",
              gridTemplateColumns: "26px 1fr",
              gap: 12,
              color: currentPalette.textMuted,
              fontFamily: THEME.fonts.bodyZh,
              fontSize: 25,
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: currentPalette.accent }}>0{index + 1}</span>
            <span>{point}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <SceneFrame palette={currentPalette}>
      <AbsoluteFill style={{ justifyContent: "center", gap: 32 }}>
        {title ? (
          <div
            style={{
              color: currentPalette.textPrimary,
              fontFamily: THEME.fonts.headlineZh,
              fontWeight: 800,
              fontSize: 72,
              lineHeight: 1.04,
            }}
          >
            {title}
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "stretch", gap: 22 }}>
          {renderPanel(leftTitle, leftPoints, "left")}
          <div
            style={{
              width: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentPalette.accent,
              fontFamily: THEME.fonts.numbers,
              fontSize: 54,
              opacity: reveal,
            }}
          >
            →
          </div>
          {renderPanel(rightTitle, rightPoints, "right")}
        </div>
        <div
          style={{
            color: currentPalette.textMuted,
            fontFamily: THEME.fonts.bodyZh,
            fontSize: 26,
            lineHeight: 1.42,
            maxWidth: 1200,
          }}
        >
          {footer}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
