import React from "react";
import { AbsoluteFill } from "remotion";
import { PsychBaseScene, PsychIconFigure, PsychTitleBlock, RevealContainer, ZhEnCaption } from "./PsychPrimitives";

export const PsychSeriesTitleScene: React.FC<{ seriesLabel: string; title: string; accent: string; footer: string }> = ({
  seriesLabel,
  title,
  accent,
  footer,
}) => {
  return (
    <PsychBaseScene titleLeft={seriesLabel} titleRight="">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <RevealContainer>
          <PsychTitleBlock title={title} accent={accent} />
        </RevealContainer>
        <RevealContainer delay={8}>
          <div style={{ position: "absolute", right: 420, bottom: 210, transform: "scale(.72)" }}>
            <PsychIconFigure type="desk" />
          </div>
        </RevealContainer>
      </AbsoluteFill>
      <ZhEnCaption zh={footer} />
    </PsychBaseScene>
  );
};
