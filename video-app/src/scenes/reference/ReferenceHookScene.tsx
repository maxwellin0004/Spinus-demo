import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { ReferencePalette, withPalette } from "../../lib/referencePalette";
import { THEME } from "../../theme/tokens";

type HookFrame = {
  label: string;
  title: string;
  ghost: string;
  subtitle: string;
};

type ReferenceHookSceneProps = {
  frames: readonly HookFrame[];
  palette?: Partial<ReferencePalette>;
};

export const ReferenceHookScene: React.FC<ReferenceHookSceneProps> = ({
  frames,
  palette,
}) => {
  const currentPalette = withPalette(palette);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = Math.min(frames.length - 1, Math.floor(frame / (fps * 2)));
  const active = frames[step];
  const reveal = spring({
    fps,
    frame: frame - step * fps * 2,
    config: { damping: 15, stiffness: 160 },
  });
  const ghostOpacity = interpolate(reveal, [0, 1], [0.1, 0.34]);

  return (
    <SceneFrame accentOpacity={0.22} palette={currentPalette}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 54,
            left: 78,
            border: `1px solid ${currentPalette.frame}`,
            borderRadius: 999,
            padding: "10px 18px",
            color: currentPalette.accent,
            fontFamily: THEME.fonts.ui,
            fontSize: 18,
            letterSpacing: 1.2,
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {active.label}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: `rgba(${currentPalette.accentRgb},${ghostOpacity})`,
            fontFamily: THEME.fonts.headlineZh,
            fontWeight: 800,
            fontSize: 250,
            letterSpacing: 6,
            transform: `translateY(${interpolate(reveal, [0, 1], [50, 0])}px)`,
          }}
        >
          {active.ghost}
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            transform: `scale(${0.9 + reveal * 0.1})`,
          }}
        >
          <div
            style={{
              color: currentPalette.textPrimary,
              fontFamily: THEME.fonts.headlineZh,
              fontSize: 136,
              fontWeight: 800,
              lineHeight: 0.94,
              textAlign: "center",
              textShadow: `0 0 24px rgba(${currentPalette.accentRgb},0.16)`,
            }}
          >
            {active.title}
          </div>
          <div
            style={{
              color: currentPalette.textMuted,
              fontFamily: THEME.fonts.bodyZh,
              fontSize: 30,
              lineHeight: 1.35,
              textAlign: "center",
              maxWidth: 900,
            }}
          >
            {active.subtitle}
          </div>
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
