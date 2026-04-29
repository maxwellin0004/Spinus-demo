import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../../theme/tokens";
import type { ParadoxScene } from "../../data/combinatorialParadoxCinematicData";

const palette = {
  ink: "#17130e",
  paper: "#efe2c0",
  amber: "#f0a04a",
  rust: "#9d4f29",
  teal: "#6ba5a2",
  shadow: "rgba(0,0,0,0.34)",
};

const overlayLabel: React.CSSProperties = {
  fontFamily: THEME.fonts.bodyZh,
  fontWeight: 800,
  letterSpacing: 0,
};

const SceneImagePlate: React.FC<{
  src: string;
  kicker: string;
  title: string;
  caption?: string;
  pan?: "push" | "left" | "right";
}> = ({ src, kicker, title, caption, pan = "push" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ fps, frame, config: { damping: 18, stiffness: 110 } });
  const scale = interpolate(frame, [0, 180], [1.02, 1.08], { extrapolateRight: "clamp" });
  const shiftX =
    pan === "left"
      ? interpolate(frame, [0, 180], [20, -28], { extrapolateRight: "clamp" })
      : pan === "right"
        ? interpolate(frame, [0, 180], [-20, 28], { extrapolateRight: "clamp" })
        : 0;
  const shiftY = interpolate(frame, [0, 180], [8, -10], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#12100d", overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${shiftX}px, ${shiftY}px) scale(${scale})`,
          filter: "saturate(1.02) contrast(1.04)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.32), transparent 22%, transparent 74%, rgba(0,0,0,0.52)), radial-gradient(circle at 50% 16%, rgba(240,160,74,0.10), transparent 24%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 42,
          display: "flex",
          alignItems: "center",
          gap: 14,
          transform: `translateY(${(1 - intro) * 10}px)`,
          opacity: intro,
        }}
      >
        <div
          style={{
            ...overlayLabel,
            fontSize: 20,
            color: "#fff1dc",
            background: "rgba(18,15,11,0.84)",
            padding: "8px 14px",
            boxShadow: `0 12px 24px ${palette.shadow}`,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            ...overlayLabel,
            fontSize: 18,
            color: "rgba(255,240,220,0.82)",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          {title}
        </div>
      </div>
      {caption ? (
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: 144,
            maxWidth: 520,
            padding: "14px 18px",
            background: "rgba(20,16,11,0.58)",
            border: "1px solid rgba(240,160,74,0.22)",
            boxShadow: `0 14px 24px ${palette.shadow}`,
            fontFamily: THEME.fonts.bodyZh,
            fontSize: 24,
            lineHeight: 1.35,
            fontWeight: 700,
            color: "#fff2de",
            opacity: 0.92,
          }}
        >
          {caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const PaperCloseScene: React.FC<{
  leftLabel: string;
  rightLabel: string;
  closingRule: string;
}> = ({ leftLabel, rightLabel, closingRule }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const merge = spring({ fps, frame, config: { damping: 18, stiffness: 110 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.paper,
        backgroundImage: [
          "linear-gradient(180deg, rgba(255,255,255,0.38), rgba(0,0,0,0.04))",
          "repeating-linear-gradient(0deg, rgba(120,94,63,0.032) 0 2px, transparent 2px 6px)",
          "repeating-linear-gradient(90deg, rgba(120,94,63,0.024) 0 3px, transparent 3px 10px)",
          "radial-gradient(circle at 18% 12%, rgba(255,248,232,0.78), transparent 22%)",
          "radial-gradient(circle at 78% 24%, rgba(240,143,54,0.16), transparent 24%)",
        ].join(", "),
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: "2px solid rgba(61, 38, 21, 0.16)",
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.26), inset 0 0 120px rgba(0,0,0,0.08)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 48,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div
          style={{
            ...overlayLabel,
            fontSize: 20,
            color: "#fff1dc",
            background: "rgba(18,15,11,0.86)",
            padding: "8px 14px",
          }}
        >
          方法论收束
        </div>
        <div style={{ ...overlayLabel, fontSize: 18, color: "rgba(23,19,14,0.72)" }}>反直觉题的真正价值</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 124 - merge * 30,
          top: 244,
          width: 418,
          height: 324,
          background: "rgba(255,250,240,0.78)",
          border: `2px solid rgba(35,25,18,0.16)`,
          boxShadow: `0 18px 30px ${palette.shadow}`,
          padding: 28,
        }}
      >
        <div style={{ ...overlayLabel, fontSize: 24, color: palette.rust }}>{leftLabel}</div>
        <div style={{ ...overlayLabel, fontSize: 42, marginTop: 18, color: palette.ink }}>只盯单个对象</div>
        <div style={{ ...overlayLabel, fontSize: 28, marginTop: 18, color: "rgba(23,19,14,0.68)" }}>会严重低估关系增长</div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 124 - merge * 30,
          top: 244,
          width: 418,
          height: 324,
          background: "rgba(255,250,240,0.78)",
          border: `2px solid rgba(35,25,18,0.16)`,
          boxShadow: `0 18px 30px ${palette.shadow}`,
          padding: 28,
        }}
      >
        <div style={{ ...overlayLabel, fontSize: 24, color: palette.teal }}>{rightLabel}</div>
        <div style={{ ...overlayLabel, fontSize: 42, marginTop: 18, color: palette.ink }}>先看成组关系</div>
        <div style={{ ...overlayLabel, fontSize: 28, marginTop: 18, color: "rgba(23,19,14,0.68)" }}>很多反直觉都会立刻变清楚</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 648,
          transform: `translateX(-50%) scale(${0.94 + merge * 0.06})`,
          width: 980,
          padding: "22px 30px",
          background: "rgba(25,19,14,0.9)",
          color: "#fff7e8",
          textAlign: "center",
          fontFamily: THEME.fonts.bodyZh,
          fontSize: 42,
          fontWeight: 800,
          lineHeight: 1.24,
          boxShadow: `0 18px 28px ${palette.shadow}`,
        }}
      >
        {closingRule}
      </div>
    </AbsoluteFill>
  );
};

export const ParadoxColdOpenScene: React.FC<{ scene: Extract<ParadoxScene, { type: "ParadoxColdOpenScene" }> }> = () => {
  return (
    <SceneImagePlate
      src="/images/combinatorial-paradox/panel-1-cold-open.png"
      kicker="反直觉问题"
      title="冷开场"
      caption="先抛问题，不先解释。"
      pan="push"
    />
  );
};

export const RuleTheaterScene: React.FC<{ scene: Extract<ParadoxScene, { type: "RuleTheaterScene" }> }> = () => {
  return (
    <SceneImagePlate
      src="/images/combinatorial-paradox/panel-2-wrong-path.png"
      kicker="错误直觉"
      title="先让观众站错一次"
      caption="先看起来合理，再显出它为什么错。"
      pan="right"
    />
  );
};

export const MechanismGridScene: React.FC<{ scene: Extract<ParadoxScene, { type: "MechanismGridScene" }> }> = () => {
  return (
    <SceneImagePlate
      src="/images/combinatorial-paradox/panel-3-mechanism.png"
      kicker="机制揭示"
      title="真正可复用的 scene"
      caption="新增一个对象，会把比较关系整排带出来。"
      pan="left"
    />
  );
};

export const ProbabilityBoardScene: React.FC<{ scene: Extract<ParadoxScene, { type: "ProbabilityBoardScene" }> }> = () => {
  return (
    <SceneImagePlate
      src="/images/combinatorial-paradox/panel-4-probability.png"
      kicker="结论落地"
      title="不是猜对了，是算出来了"
      caption="数字必须像推导后的结果，而不是海报口号。"
      pan="push"
    />
  );
};

export const ReflectiveCloseScene: React.FC<{ scene: Extract<ParadoxScene, { type: "ReflectiveCloseScene" }> }> = ({
  scene,
}) => {
  return <PaperCloseScene leftLabel={scene.leftLabel} rightLabel={scene.rightLabel} closingRule={scene.closingRule} />;
};
