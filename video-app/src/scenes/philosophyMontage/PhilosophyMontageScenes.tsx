import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import {
  philosophyMontageOpenerConfig,
  philosophyMontageScenes,
  type PhilosophyMontageOpenerConfig,
  type PhilosophyMontageScene,
} from "../../data/PhilosophyMontageValidationData";

const textBaseStyle: React.CSSProperties = {
  fontFamily: '"NotoSansSC", sans-serif',
  fontWeight: 900,
  letterSpacing: 3,
  transform: "skewX(-8deg)",
  color: "#ffffff",
  WebkitTextStroke: "2px rgba(15,23,42,0.28)",
  textShadow: "0 4px 10px rgba(0,0,0,0.45)",
};

const OpenerConceptSwitch: React.FC<{ openerConfig: PhilosophyMontageOpenerConfig }> = ({ openerConfig }) => {
  const frame = useCurrentFrame();
  const introFrames = openerConfig.introFrames ?? 24;
  const conceptFrame = Math.max(0, frame - introFrames);
  const inIntro = frame < introFrames;
  const terms = openerConfig.terms;
  const switchEvery = openerConfig.switchEvery ?? 9;
  const shockPhaseEnd = terms.length * switchEvery;
  const lockPhaseEnd = shockPhaseEnd + 42;
  const termIndex = Math.min(terms.length - 1, Math.floor(conceptFrame / switchEvery));
  const isFinal = conceptFrame >= shockPhaseEnd;
  const term = terms[termIndex];
  const popScale = interpolate(conceptFrame % switchEvery, [0, switchEvery - 1], [0.82, 1.1], {
    extrapolateRight: "clamp",
  });
  const phaseTerm = conceptFrame < shockPhaseEnd ? term : terms[terms.length - 1];
  const lockScale = interpolate(conceptFrame, [shockPhaseEnd, lockPhaseEnd], [1.18, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lockOpacity = interpolate(conceptFrame, [shockPhaseEnd - 2, shockPhaseEnd + 8, lockPhaseEnd], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shockOpacity = interpolate(conceptFrame % switchEvery, [0, 2, switchEvery - 1], [0.15, 1, 0.2], {
    extrapolateRight: "clamp",
  });
  const jitterX = Math.sin(conceptFrame * 0.85) * (conceptFrame < shockPhaseEnd ? 14 : 2);
  const flashOpacity = interpolate(frame, [0, 3, 7, 12, 18], [0.95, 0.1, 0.52, 0.1, 0], {
    extrapolateRight: "clamp",
  });
  const barYOffset = interpolate(conceptFrame, [0, 10, 26], [-70, -8, 0], {
    extrapolateRight: "clamp",
  });
  const shutterTop = interpolate(frame, [0, 14, 30], [0, -160, -190], {
    extrapolateRight: "clamp",
  });
  const shutterBottom = interpolate(frame, [0, 14, 30], [0, 160, 190], {
    extrapolateRight: "clamp",
  });
  const scanOpacity = interpolate(
    conceptFrame,
    [shockPhaseEnd - 14, shockPhaseEnd - 4, shockPhaseEnd + 24],
    [0, 1, 0.65],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const introOpacity = interpolate(frame, [0, 4, introFrames - 4, introFrames], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const introScale = interpolate(frame, [0, introFrames], [1.08, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.25), transparent 62%)",
          opacity: flashOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: shutterTop,
          left: 0,
          right: 0,
          height: 200,
          background: "linear-gradient(180deg, rgba(0,0,0,0.95), rgba(0,0,0,0.1))",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: shutterBottom,
          left: 0,
          right: 0,
          height: 220,
          background: "linear-gradient(0deg, rgba(0,0,0,0.95), rgba(0,0,0,0.1))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "34%",
          transform: `translate(-50%, ${barYOffset}px)`,
          width: 860,
          height: 10,
          borderRadius: 99,
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(103,232,249,0.95), rgba(255,255,255,0))",
          boxShadow: "0 0 20px rgba(103,232,249,0.9)",
          opacity: inIntro ? 0 : 1,
        }}
      />
      {inIntro ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "43%",
            transform: `translate(-50%, -50%) scale(${introScale}) skewX(-8deg)`,
            fontFamily: '"NotoSansSC", sans-serif',
            fontWeight: 900,
            fontSize: 150,
            letterSpacing: 2,
            color: "#ffffff",
            opacity: introOpacity,
            whiteSpace: "nowrap",
            WebkitTextStroke: "2px rgba(17,24,39,0.3)",
            textShadow:
              "0 13px 0 rgba(117,137,68,0.95), 0 6px 0 rgba(117,137,68,0.95), 0 18px 30px rgba(0,0,0,0.5)",
          }}
        >
          {openerConfig.introTitle}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${jitterX}px), -50%) scale(${isFinal ? lockScale : popScale})`,
          opacity: inIntro ? 0 : isFinal ? lockOpacity : shockOpacity,
          fontSize: isFinal ? 146 : 132,
          textShadow: isFinal
            ? "0 12px 0 rgba(117,137,68,0.9), 0 18px 28px rgba(0,0,0,0.6)"
            : "0 9px 0 rgba(117,137,68,0.85), 0 12px 24px rgba(0,0,0,0.6)",
          paddingBottom: 10,
          whiteSpace: "nowrap",
          ...textBaseStyle,
        }}
      >
        {phaseTerm}
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "61%",
          transform: "translateX(-50%)",
          width: 620,
          height: 5,
          borderRadius: 99,
          background: "rgba(255,255,255,0.55)",
          opacity: inIntro
            ? 0
            : interpolate(conceptFrame, [8, 24, 40], [0, 0.9, 0.7], {
                extrapolateRight: "clamp",
              }),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "43%",
          transform: `translate(-50%, ${interpolate(conceptFrame, [42, 90], [-100, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}px)`,
          width: 760,
          height: 2,
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 0 20px rgba(255,255,255,0.9)",
          opacity: inIntro ? 0 : scanOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

const SceneCard: React.FC<{ scene: PhilosophyMontageScene; openerConfig: PhilosophyMontageOpenerConfig }> = ({
  scene,
  openerConfig,
}) => {
  const frame = useCurrentFrame();
  const isOpener = scene.type === "openerConcepts";
  const introFrames = openerConfig.introFrames ?? 24;
  const switchEvery = openerConfig.switchEvery ?? 9;
  const openerConceptFrame = Math.max(0, frame - introFrames);
  const openerBgIndex = Math.min(
    openerConfig.bgImages.length - 1,
    Math.floor(openerConceptFrame / switchEvery)
  );
  const openerImage =
    openerConfig.bgImages[openerBgIndex] ?? openerConfig.bgImages[openerConfig.bgImages.length - 1];
  const activeImage = isOpener ? openerImage : scene.image;
  const imageSrc = activeImage.startsWith("/")
    ? staticFile(activeImage.slice(1))
    : staticFile(activeImage);
  const zoom = interpolate(frame, [0, scene.duration], [isOpener ? 1.18 : 1.06, 1.14], {
    extrapolateRight: "clamp",
  });
  const driftX = interpolate(frame, [0, scene.duration], [isOpener ? -48 : -22, 22], {
    extrapolateRight: "clamp",
  });
  const driftY = interpolate(frame, [0, scene.duration], [isOpener ? 28 : 12, -8], {
    extrapolateRight: "clamp",
  });
  const openerFlash = isOpener
    ? interpolate(frame, [0, 2, 6, 12, 18], [1, 0.12, 0.65, 0.12, 0], {
        extrapolateRight: "clamp",
      })
    : 0;
  const openerEndFade = isOpener
    ? interpolate(frame, [98, 114, scene.duration], [0, 0.26, 0.5], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#020617" }}>
      <Img
        src={imageSrc}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${driftX}px, ${driftY}px) scale(${zoom})`,
          filter: isOpener
            ? "brightness(1.05) saturate(1.72) contrast(1.22) hue-rotate(-8deg)"
            : "brightness(1.08) saturate(1.5) contrast(1.12)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(255,255,255,0.26) 0%, transparent 50%), linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.2) 72%, rgba(0,0,0,0.38) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.14,
          backgroundImage:
            "linear-gradient(transparent 95%, rgba(255,255,255,0.18) 95%), linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.16) 95%)",
          backgroundSize: "120px 120px",
        }}
      />
      {isOpener ? <OpenerConceptSwitch openerConfig={openerConfig} /> : null}
      {isOpener ? (
        <AbsoluteFill
          style={{
            background: "rgba(255,255,255,1)",
            opacity: openerFlash,
          }}
        />
      ) : null}
      {isOpener ? (
        <AbsoluteFill
          style={{
            background: "linear-gradient(180deg, rgba(8,47,73,0.0), rgba(8,47,73,0.55))",
            opacity: openerEndFade,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

type PhilosophyMontageScenesProps = {
  scenes?: PhilosophyMontageScene[];
  openerConfig?: PhilosophyMontageOpenerConfig;
};

export const PhilosophyMontageScenes: React.FC<PhilosophyMontageScenesProps> = ({
  scenes = philosophyMontageScenes,
  openerConfig = philosophyMontageOpenerConfig,
}) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#030712" }}>
      {scenes.map((scene) => {
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration}>
            <SceneCard scene={scene} openerConfig={openerConfig} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
