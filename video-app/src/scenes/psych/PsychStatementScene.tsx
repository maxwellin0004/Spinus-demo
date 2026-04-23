import React from "react";
import { AbsoluteFill } from "remotion";
import { PSYCH_THEME } from "./psychTheme";
import { IntroCard, PsychBaseScene, PsychIconFigure, RevealContainer } from "./PsychPrimitives";

export const PsychStatementScene: React.FC<{
  header: string;
  zh: string;
  en: string;
  icon: string;
  bubble?: string;
}> = ({ header, icon, bubble }) => {
  return (
    <PsychBaseScene titleLeft="心理学中的反刍思维">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <RevealContainer>
          <div style={{ transform: "scale(1)" }}>
            <PsychIconFigure type={icon} />
          </div>
        </RevealContainer>
        {bubble ? (
          <div style={{ position: "absolute", right: 250, top: 214 }}>
            <RevealContainer delay={8}>
              <div
                style={{
                  padding: "14px 24px",
                  borderRadius: 26,
                  border: `2px solid ${PSYCH_THEME.border}`,
                  background: "rgba(255,255,255,0.94)",
                  boxShadow: PSYCH_THEME.shadow,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {bubble}
              </div>
            </RevealContainer>
          </div>
        ) : null}
        <div style={{ position: "absolute", top: 170 }}>
          <IntroCard text={header} />
        </div>
      </AbsoluteFill>
    </PsychBaseScene>
  );
};
