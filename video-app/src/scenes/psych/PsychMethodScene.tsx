import React from "react";
import { THEME } from "../../theme/tokens";
import { PSYCH_THEME } from "./psychTheme";
import { PsychBaseScene, PsychIconFigure, RevealContainer } from "./PsychPrimitives";

export const PsychMethodScene: React.FC<{
  title: string;
  zh: string;
  en: string;
  steps: readonly { label: string; body: string; icon: string }[];
}> = ({ title, steps }) => {
  return (
    <PsychBaseScene titleLeft="心理学中的反刍思维">
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 136,
          textAlign: "center",
          fontSize: 52,
          fontWeight: 700,
          fontFamily: THEME.fonts.headlineZh,
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 280,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 26,
        }}
      >
        {steps.map((step, index) => (
          <RevealContainer key={step.label} delay={index * 10}>
            <div
              style={{
                minHeight: 430,
                borderRadius: 30,
                background: "rgba(255,255,255,0.92)",
                border: `2px solid ${PSYCH_THEME.border}`,
                boxShadow: PSYCH_THEME.shadow,
                padding: "28px 24px 26px",
                textAlign: "center",
              }}
            >
              <div style={{ color: PSYCH_THEME.accent, fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
                {step.label}
              </div>
              <div style={{ transform: "scale(.5)", transformOrigin: "center top", height: 170, marginTop: 8 }}>
                <PsychIconFigure type={step.icon} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>{step.body}</div>
            </div>
          </RevealContainer>
        ))}
      </div>
    </PsychBaseScene>
  );
};
