import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { DossierScene } from "../../data/corporateRetreatDossierData";

const font = "'IBM Plex Sans', 'Inter', 'Microsoft YaHei', sans-serif";

const noise =
  "radial-gradient(circle at 18% 16%, rgba(255,255,255,0.16) 0 1px, transparent 1px), radial-gradient(circle at 71% 41%, rgba(0,0,0,0.18) 0 1px, transparent 1px)";

const FrameGrade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(90deg, rgba(0,0,0,0.36), transparent 22%, transparent 78%, rgba(0,0,0,0.3)), linear-gradient(180deg, rgba(0,0,0,0.24), transparent 48%, rgba(0,0,0,0.28))",
      mixBlendMode: "multiply",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: noise,
        backgroundSize: "5px 5px, 7px 7px",
        opacity: 0.22,
      }}
    />
  </AbsoluteFill>
);

const PhotoPlate: React.FC<{
  src: string;
  localFrame: number;
  duration: number;
  dark?: boolean;
  pan?: "left" | "right" | "in";
}> = ({ src, localFrame, duration, dark, pan = "in" }) => {
  const progress = interpolate(localFrame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = pan === "in" ? 1.045 + progress * 0.045 : 1.09;
  const x = pan === "left" ? interpolate(progress, [0, 1], [28, -34]) : pan === "right" ? interpolate(progress, [0, 1], [-34, 28]) : 0;
  const y = pan === "in" ? interpolate(progress, [0, 1], [12, -12]) : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#10151a" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: "-3%",
          width: "106%",
          height: "106%",
          objectFit: "cover",
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
          filter: dark ? "brightness(0.42) contrast(1.14) saturate(0.86)" : "brightness(0.9) contrast(1.1) saturate(0.92)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(4,8,12,0.52), rgba(4,8,12,0.08) 40%, rgba(4,8,12,0.28)), linear-gradient(180deg, rgba(3,7,11,0.24), transparent 52%, rgba(3,7,11,0.5))",
        }}
      />
    </AbsoluteFill>
  );
};

const CityPlate: React.FC<{ label: string; localFrame: number; dark?: boolean }> = ({
  label,
  localFrame,
  dark,
}) => {
  const drift = interpolate(localFrame, [0, 180], [0, -42], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: dark
          ? "linear-gradient(180deg, #17202a 0%, #2d3135 52%, #0d1216 100%)"
          : "linear-gradient(180deg, #c9e4f2 0%, #e6eef0 48%, #27313a 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-6% -4%",
          transform: `translateX(${drift}px) scale(1.04)`,
        }}
      >
        {Array.from({ length: 16 }).map((_, index) => {
          const height = 210 + ((index * 57) % 310);
          const left = index * 145 - 80;
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left,
                bottom: 185 + ((index * 19) % 56),
                width: 86 + ((index * 13) % 70),
                height,
                background:
                  index % 3 === 0
                    ? "linear-gradient(90deg, #9ca8af, #edf2f3 42%, #68747a)"
                    : "linear-gradient(90deg, #2d3a42, #6f8188 50%, #1c252b)",
                boxShadow: "0 24px 50px rgba(0,0,0,0.34)",
                opacity: dark ? 0.72 : 0.92,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 10,
                  background:
                    "repeating-linear-gradient(180deg, rgba(255,255,255,0.28) 0 3px, transparent 3px 17px)",
                }}
              />
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 230,
            background:
              "linear-gradient(180deg, rgba(43,50,55,0.3), rgba(10,14,18,0.92)), repeating-linear-gradient(115deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 38px)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 76,
          top: 72,
          color: "rgba(255,255,255,0.72)",
          fontFamily: font,
          fontWeight: 800,
          letterSpacing: 2,
          fontSize: 22,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};

const DossierCard: React.FC<{ lines: string[]; localFrame: number }> = ({ lines, localFrame }) => {
  const enter = spring({ fps: 30, frame: localFrame - 8, config: { damping: 18, stiffness: 95 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        top: 160,
        width: 450,
        minHeight: 390,
        padding: "34px 38px",
        background: "rgba(19,22,24,0.86)",
        border: "1px solid rgba(238,224,190,0.64)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.34)",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 26}px)`,
        color: "#f4ead8",
        fontFamily: font,
      }}
    >
      <div style={{ fontSize: 24, color: "#d8c7a1", fontWeight: 900, marginBottom: 30 }}>
        撤退观察
      </div>
      {lines.map((line, index) => (
        <div
          key={line}
          style={{
            fontSize: index === 0 ? 44 : 34,
            fontWeight: 900,
            marginBottom: 22,
            color: index === 0 ? "#f0cc68" : "#f8f4ed",
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

const IndustrialPlate: React.FC<{ palette: "factory" | "boardroom" | "construction"; localFrame: number }> = ({
  palette,
  localFrame,
}) => {
  const pan = interpolate(localFrame, [0, 210], [0, -70], { extrapolateRight: "clamp" });
  const colors = {
    factory: ["#d7e2e0", "#6e8583", "#1f3035"],
    boardroom: ["#e9ece8", "#998b77", "#1d2023"],
    construction: ["#d8e8ef", "#b99054", "#20262a"],
  }[palette];
  return (
    <AbsoluteFill style={{ background: colors[0], overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: -40, transform: `translateX(${pan}px) scale(1.04)` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${colors[0]} 0%, #f9faf8 45%, ${colors[2]} 100%)`,
          }}
        />
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: 160 + index * 190,
              top: 140 + ((index * 41) % 280),
              width: palette === "boardroom" ? 130 : 46,
              height: palette === "boardroom" ? 86 : 460,
              border: `7px solid ${colors[1]}`,
              background: "rgba(255,255,255,0.18)",
              transform: `skewX(${palette === "construction" ? -10 : 0}deg)`,
              opacity: 0.82,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 120,
            height: 190,
            background:
              palette === "boardroom"
                ? "linear-gradient(90deg, rgba(0,0,0,0.36), transparent), repeating-linear-gradient(90deg, rgba(255,255,255,0.38) 0 120px, rgba(0,0,0,0.12) 120px 126px)"
                : "repeating-linear-gradient(90deg, rgba(0,0,0,0.32) 0 20px, transparent 20px 76px)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const DossierSceneView: React.FC<{ scene: DossierScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame;
  const fade = interpolate(localFrame, [0, 12, scene.durationInFrames - 16, scene.durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (scene.type === "shockTitle") {
    const titleSpring = spring({ fps, frame: localFrame - 14, config: { damping: 14, stiffness: 120 } });
    return (
      <AbsoluteFill style={{ opacity: fade, background: "#121820" }}>
        <PhotoPlate src={scene.assetSrc} localFrame={localFrame} duration={scene.durationInFrames} dark pan="in" />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 54% 32%, rgba(255,255,255,0.28), transparent 18%), linear-gradient(115deg, transparent 0 42%, rgba(255,255,255,0.34) 45%, transparent 50%)",
            filter: "blur(4px)",
            opacity: interpolate(localFrame, [4, 28, 74], [0, 1, 0.52], { extrapolateRight: "clamp" }),
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 330,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: font,
            color: "white",
            fontSize: 118,
            fontWeight: 1000,
            textShadow: "0 7px 18px rgba(0,0,0,0.62)",
            transform: `scale(${0.84 + titleSpring * 0.16})`,
          }}
        >
          {scene.headline}
        </div>
        <FrameGrade />
      </AbsoluteFill>
    );
  }

  if (scene.type === "statDossier") {
    return (
      <AbsoluteFill style={{ opacity: fade }}>
        <PhotoPlate src={scene.assetSrc} localFrame={localFrame} duration={scene.durationInFrames} pan="left" />
        <div
          style={{
            position: "absolute",
            right: 76,
            top: 72,
            color: "rgba(255,255,255,0.78)",
            fontFamily: font,
            fontWeight: 800,
            letterSpacing: 2,
            fontSize: 22,
          }}
        >
          {scene.buildingLabel}
        </div>
        <DossierCard lines={scene.statLines} localFrame={localFrame} />
        <FrameGrade />
      </AbsoluteFill>
    );
  }

  if (scene.type === "evidenceMontage") {
    return (
      <AbsoluteFill style={{ opacity: fade }}>
        <PhotoPlate
          src={scene.assetSrc}
          localFrame={localFrame}
          duration={scene.durationInFrames}
          pan={scene.palette === "boardroom" ? "right" : "left"}
        />
        <div
          style={{
            position: "absolute",
            left: 86,
            top: 74,
            display: "flex",
            gap: 16,
            fontFamily: font,
          }}
        >
          {scene.evidenceLabels.map((label, index) => (
            <div
              key={label}
              style={{
                padding: "10px 16px",
                background: "rgba(0,0,0,0.56)",
                color: index === 0 ? "#f0cc68" : "#ffffff",
                fontSize: 25,
                fontWeight: 900,
                border: "1px solid rgba(255,255,255,0.22)",
                opacity: interpolate(localFrame, [index * 20, index * 20 + 18], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <FrameGrade />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ opacity: fade, background: "#dfe5e4" }}>
      <PhotoPlate src={scene.assetSrc} localFrame={localFrame} duration={scene.durationInFrames} dark pan="in" />
      <div
        style={{
          position: "absolute",
          left: 180,
          right: 180,
          top: 190,
          padding: "48px 58px",
          background: "rgba(246,242,232,0.9)",
          borderLeft: "10px solid #2d3236",
          fontFamily: font,
          color: "#202326",
          boxShadow: "0 28px 80px rgba(0,0,0,0.34)",
        }}
      >
        <div style={{ fontSize: 58, lineHeight: 1.12, fontWeight: 1000, marginBottom: 42 }}>
          {scene.thesis}
        </div>
        {scene.bullets.map((bullet, index) => (
          <div key={bullet} style={{ fontSize: 34, fontWeight: 850, marginTop: 22, color: "#475058" }}>
            0{index + 1} / {bullet}
          </div>
        ))}
      </div>
      <FrameGrade />
    </AbsoluteFill>
  );
};
