import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import { PSYCH_THEME } from "./psychTheme";

type BaseSceneProps = {
  titleLeft: string;
  titleRight?: string;
  children: React.ReactNode;
};

export const PsychBaseScene: React.FC<BaseSceneProps> = ({
  titleLeft,
  titleRight = "心理知识分享 无不良引导",
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: PSYCH_THEME.background,
        color: PSYCH_THEME.line,
        fontFamily: THEME.fonts.bodyZh,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 38,
          right: 38,
          top: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 24,
          zIndex: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontWeight: 700 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "linear-gradient(180deg, #77a6e6 0%, #4d78c3 100%)",
              boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.58)",
            }}
          />
          <span>{titleLeft}</span>
        </div>
        <div style={{ fontSize: 18, color: PSYCH_THEME.muted }}>{titleRight}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 166,
          height: 3,
          background: "rgba(0,0,0,0.84)",
          zIndex: 2,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

export const PsychTitleBlock: React.FC<{ eyebrow?: string; title: string; accent?: string }> = ({
  eyebrow,
  title,
  accent,
}) => {
  return (
    <div style={{ textAlign: "center" }}>
      {eyebrow ? (
        <div style={{ fontSize: 30, color: PSYCH_THEME.muted, marginBottom: 18 }}>{eyebrow}</div>
      ) : null}
      <div
        style={{
          fontFamily: THEME.fonts.headlineZh,
          fontWeight: 700,
          fontSize: 78,
          lineHeight: 1.08,
        }}
      >
        {title}
      </div>
      {accent ? (
        <div
          style={{
            fontFamily: THEME.fonts.headlineZh,
            fontWeight: 700,
            fontSize: 74,
            lineHeight: 1.08,
            color: PSYCH_THEME.accent,
          }}
        >
          {accent}
        </div>
      ) : null}
    </div>
  );
};

export const IntroCard: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div
      style={{
        padding: "18px 26px",
        borderRadius: 999,
        border: `2px solid ${PSYCH_THEME.border}`,
        background: "rgba(255,255,255,0.93)",
        boxShadow: PSYCH_THEME.shadow,
        fontSize: 28,
        fontWeight: 700,
      }}
    >
      {text}
    </div>
  );
};

export const RevealContainer: React.FC<{ children: React.ReactNode; delay?: number; y?: number }> = ({
  children,
  delay = 0,
  y = 24,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ fps, frame: frame - delay, config: { damping: 18, stiffness: 110 } });
  return <div style={{ opacity: intro, transform: `translateY(${(1 - intro) * y}px)` }}>{children}</div>;
};

export const ZhEnCaption: React.FC<{ zh: string; en?: string }> = ({ zh, en }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 34,
        textAlign: "center",
        zIndex: 3,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 700, marginBottom: 8 }}>{zh}</div>
      {en ? (
        <div style={{ fontSize: 26, color: PSYCH_THEME.muted, fontFamily: THEME.fonts.bodyEn }}>{en}</div>
      ) : null}
    </div>
  );
};

const SvgStage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width="620" height="360" viewBox="0 0 620 360" role="img" style={{ overflow: "visible" }}>
    {children}
  </svg>
);

const PersonIcon: React.FC<{ x?: number; y?: number; scale?: number; pose?: "stand" | "sit" | "walk" }> = ({
  x = 260,
  y = 36,
  scale = 1,
  pose = "stand",
}) => {
  const transform = `translate(${x} ${y}) scale(${scale})`;
  if (pose === "sit") {
    return (
      <g transform={transform} fill="#111">
        <circle cx="60" cy="36" r="32" />
        <rect x="28" y="78" width="72" height="92" rx="34" />
        <rect x="-8" y="112" width="76" height="20" rx="10" transform="rotate(-18 30 122)" />
        <rect x="82" y="108" width="88" height="20" rx="10" transform="rotate(16 126 118)" />
        <rect x="30" y="160" width="22" height="94" rx="11" transform="rotate(8 41 207)" />
        <rect x="76" y="160" width="22" height="94" rx="11" transform="rotate(-8 87 207)" />
      </g>
    );
  }
  if (pose === "walk") {
    return (
      <g transform={transform} fill="#111">
        <circle cx="60" cy="34" r="30" />
        <rect x="32" y="74" width="66" height="96" rx="30" />
        <rect x="-4" y="100" width="92" height="18" rx="9" transform="rotate(24 42 109)" />
        <rect x="68" y="106" width="96" height="18" rx="9" transform="rotate(-20 116 115)" />
        <rect x="32" y="154" width="22" height="102" rx="11" transform="rotate(22 43 205)" />
        <rect x="78" y="154" width="22" height="104" rx="11" transform="rotate(-18 89 206)" />
      </g>
    );
  }
  return (
    <g transform={transform} fill="#111">
      <circle cx="60" cy="34" r="30" />
      <rect x="30" y="72" width="66" height="104" rx="32" />
      <rect x="-8" y="96" width="90" height="18" rx="9" transform="rotate(25 37 105)" />
      <rect x="72" y="94" width="94" height="18" rx="9" transform="rotate(-25 119 103)" />
      <rect x="34" y="160" width="22" height="104" rx="11" transform="rotate(8 45 212)" />
      <rect x="76" y="160" width="22" height="104" rx="11" transform="rotate(-8 87 212)" />
    </g>
  );
};

export const PsychIconFigure: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case "desk":
      return (
        <SvgStage>
          <rect x="86" y="236" width="230" height="16" rx="8" fill="#111" />
          <rect x="102" y="248" width="18" height="86" rx="9" fill="#111" />
          <rect x="276" y="248" width="18" height="86" rx="9" fill="#111" />
          <rect x="120" y="170" width="90" height="44" rx="6" fill="#111" transform="rotate(-8 165 192)" />
          <rect x="400" y="94" width="88" height="62" rx="8" fill="#111" />
          <rect x="438" y="156" width="10" height="86" rx="5" fill="#111" />
          <PersonIcon x={246} y={68} scale={0.82} pose="sit" />
        </SvgStage>
      );
    case "replay":
      return (
        <SvgStage>
          <PersonIcon x={250} y={50} scale={0.88} />
          <path d="M190 88a116 116 0 0 1 214-14" fill="none" stroke="#111" strokeWidth="18" strokeLinecap="round" />
          <path d="M407 74l-16-54 58 10z" fill="#111" />
          <path d="M430 236a116 116 0 0 1-224 10" fill="none" stroke="#111" strokeWidth="18" strokeLinecap="round" />
          <path d="M204 246l20 52-59-6z" fill="#111" />
        </SvgStage>
      );
    case "person":
      return (
        <SvgStage>
          <PersonIcon x={250} y={40} scale={1} />
        </SvgStage>
      );
    case "treadmill":
      return (
        <SvgStage>
          <rect x="90" y="278" width="332" height="18" rx="9" fill="#111" transform="rotate(-10 256 287)" />
          <rect x="420" y="88" width="18" height="198" rx="9" fill="#111" />
          <rect x="430" y="80" width="132" height="18" rx="9" fill="#111" transform="rotate(-24 496 89)" />
          <path d="M176 84h92" stroke="#111" strokeWidth="16" strokeLinecap="round" />
          <path d="M256 48l52 44-52 44z" fill="#111" />
          <PersonIcon x={238} y={88} scale={0.74} pose="walk" />
        </SvgStage>
      );
    case "knot":
      return (
        <SvgStage>
          <path
            d="M70 206C164 54 286 306 376 176C452 66 518 234 568 132"
            stroke="#111"
            strokeWidth="24"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M72 140C170 270 258 74 354 202C438 318 508 116 564 224"
            stroke="#111"
            strokeWidth="24"
            fill="none"
            strokeLinecap="round"
          />
        </SvgStage>
      );
    case "write":
      return (
        <SvgStage>
          <rect x="156" y="106" width="220" height="160" rx="22" fill="#fff" stroke="#111" strokeWidth="14" />
          <rect x="196" y="150" width="126" height="11" rx="5" fill="#111" />
          <rect x="196" y="184" width="94" height="11" rx="5" fill="#111" />
          <rect x="324" y="198" width="142" height="17" rx="8" fill="#111" transform="rotate(-36 395 206)" />
          <rect x="450" y="164" width="30" height="36" rx="4" fill="#111" transform="rotate(-36 465 182)" />
        </SvgStage>
      );
    case "step":
      return (
        <SvgStage>
          <rect x="78" y="262" width="120" height="18" rx="9" fill="#111" />
          <rect x="228" y="212" width="130" height="18" rx="9" fill="#111" />
          <rect x="388" y="154" width="138" height="18" rx="9" fill="#111" />
          <path d="M270 74h92" stroke="#111" strokeWidth="16" strokeLinecap="round" />
          <path d="M350 38l52 44-52 44z" fill="#111" />
          <PersonIcon x={284} y={38} scale={0.76} pose="walk" />
        </SvgStage>
      );
    case "calm":
      return (
        <SvgStage>
          <PersonIcon x={250} y={42} scale={0.92} />
          <path d="M118 200c26-24 52-24 78 0s52 24 78 0" stroke="#4d78c3" strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M352 200c26-24 52-24 78 0s52 24 78 0" stroke="#4d78c3" strokeWidth="13" fill="none" strokeLinecap="round" />
        </SvgStage>
      );
    default:
      return <div />;
  }
};
