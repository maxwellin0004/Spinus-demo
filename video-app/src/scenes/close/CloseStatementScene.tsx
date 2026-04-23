import { AbsoluteFill } from "remotion";
import { SceneFrame } from "../../components/SceneFrame";
import { THEME } from "../../theme/tokens";

type CloseStatementSceneProps = {
  eyebrow?: string;
  headline: string;
  subheadline: string;
};

export const CloseStatementScene: React.FC<CloseStatementSceneProps> = ({
  eyebrow,
  headline,
  subheadline,
}) => {
  return (
    <SceneFrame>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 24,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              color: THEME.colors.accent,
              fontSize: 24,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              fontWeight: 700,
              fontFamily: THEME.fonts.ui,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            color: THEME.colors.textPrimary,
            fontSize: 86,
            lineHeight: 1,
            fontWeight: 800,
            maxWidth: 860,
            fontFamily: THEME.fonts.headlineZh,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            color: THEME.colors.textMuted,
            fontSize: 34,
            lineHeight: 1.35,
            maxWidth: 720,
            fontFamily: THEME.fonts.bodyZh,
          }}
        >
          {subheadline}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
