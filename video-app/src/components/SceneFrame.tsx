import { AbsoluteFill } from "remotion";
import { ReactNode } from "react";
import { ReferencePalette, withPalette } from "../lib/referencePalette";
import { THEME } from "../theme/tokens";

type SceneFrameProps = {
  children: ReactNode;
  accentOpacity?: number;
  palette?: Partial<ReferencePalette>;
};

export const SceneFrame: React.FC<SceneFrameProps> = ({
  children,
  accentOpacity = 0.16,
  palette,
}) => {
  const currentPalette = withPalette(palette);

  return (
    <AbsoluteFill
      style={{
        background: currentPalette.background,
        padding: `${THEME.spacing.safeY}px ${THEME.spacing.safeX}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: `1px solid ${currentPalette.frame}`,
          borderRadius: 28,
          opacity: 0.65,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            `radial-gradient(circle at top, rgba(${currentPalette.accentRgb},${accentOpacity}), transparent 35%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          opacity: 0.28,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 2px, transparent 6px)",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
