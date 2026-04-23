import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import type { TechArchiveChapter } from "../../data/techArchiveData";

const palette = {
  bg: "#07090d",
  panel: "rgba(18, 22, 28, 0.78)",
  panelStrong: "rgba(24, 29, 36, 0.92)",
  line: "rgba(126, 255, 179, 0.22)",
  green: "#62ff9f",
  text: "#f3f7f4",
  muted: "rgba(230, 239, 233, 0.68)",
  amber: "#f4d35e",
  red: "#ff5b5b",
};

const archiveBackground = {
  background:
    "radial-gradient(circle at 18% 12%, rgba(98,255,159,0.18), transparent 24%), radial-gradient(circle at 80% 8%, rgba(244,211,94,0.12), transparent 20%), linear-gradient(180deg, #080b10 0%, #05070a 100%)",
};

const gridOverlay = {
  backgroundImage:
    "linear-gradient(rgba(126,255,179,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(126,255,179,0.08) 1px, transparent 1px)",
  backgroundSize: "42px 42px",
  opacity: 0.45,
};

const Mascot: React.FC<{ x?: number; y?: number; scale?: number }> = ({ x = 0, y = 0, scale = 1 }) => (
  <div
    style={{
      position: "absolute",
      right: 72 + x,
      bottom: 72 + y,
      width: 126 * scale,
      height: 94 * scale,
      transform: `rotate(-6deg) scale(${scale})`,
      filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.5))",
    }}
  >
    <div
      style={{
        position: "absolute",
        width: 92,
        height: 62,
        borderRadius: "48% 52% 46% 54%",
        background: "#f7f5e8",
        bottom: 0,
        left: 10,
      }}
    />
    <div
      style={{
        position: "absolute",
        width: 52,
        height: 44,
        borderRadius: "50%",
        background: "#f7f5e8",
        top: 6,
        right: 2,
      }}
    />
    <div style={{ position: "absolute", right: -20, top: 28, width: 34, height: 14, background: "#ffbe3d", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
    <div style={{ position: "absolute", right: 18, top: 23, width: 7, height: 7, borderRadius: 99, background: "#10151a" }} />
    <div style={{ position: "absolute", left: 0, bottom: 22, width: 44, height: 32, borderRadius: "60% 40% 55% 45%", background: "#e8e5d5", transform: "rotate(-18deg)" }} />
  </div>
);

const ConnectorDiagram: React.FC<{ active?: "left" | "right" | "both" }> = ({ active = "both" }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
    {["left", "right"].map((side) => {
      const on = active === "both" || active === side;
      return (
        <div key={side} style={{ textAlign: "center" }}>
          <div
            style={{
              margin: "0 auto 18px",
              width: 120,
              height: 156,
              borderRadius: 18,
              background: on ? "linear-gradient(180deg, #f6fff9, #c8ffd9)" : "#d7dbe0",
              boxShadow: on ? "0 0 34px rgba(98,255,159,0.45)" : "none",
              border: `2px solid ${on ? palette.green : "rgba(255,255,255,0.2)"}`,
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", left: 24, right: 24, top: 46, height: 48, borderRadius: 14, background: on ? "#102818" : "#8d9499" }} />
          </div>
          <div style={{ color: on ? palette.green : palette.muted, fontFamily: THEME.fonts.numbers, fontSize: 30 }}>120W</div>
        </div>
      );
    })}
  </div>
);

const DocCard: React.FC<{ title: string; highlight?: string }> = ({ title, highlight = "USB Power Delivery" }) => (
  <div
    style={{
      width: 520,
      height: 340,
      background: "#f4f2e8",
      color: "#121417",
      borderRadius: 10,
      padding: 34,
      transform: "rotate(-3deg)",
      boxShadow: "0 22px 45px rgba(0,0,0,0.38)",
      fontFamily: THEME.fonts.bodyZh,
    }}
  >
    <div style={{ fontFamily: THEME.fonts.numbers, fontSize: 18, color: "#666", marginBottom: 22 }}>ARCHIVE DOCUMENT</div>
    <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 24 }}>{title}</div>
    <div style={{ height: 12, background: "#d8d3c7", marginBottom: 14 }} />
    <div style={{ height: 12, background: "#d8d3c7", marginBottom: 14, width: "78%" }} />
    <div style={{ height: 34, background: "rgba(98,255,159,0.52)", marginTop: 22, display: "flex", alignItems: "center", paddingLeft: 12, fontWeight: 900 }}>
      {highlight}
    </div>
    <div style={{ height: 12, background: "#d8d3c7", marginTop: 22, width: "88%" }} />
  </div>
);

export const TechArchiveHookScene: React.FC<{
  kicker: string;
  leftMetric: string;
  rightMetric: string;
  question: string;
  answer: string;
}> = ({ kicker, leftMetric, rightMetric, question, answer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const pulse = interpolate(frame % 60, [0, 30, 60], [0.65, 1, 0.65]);

  return (
    <AbsoluteFill style={{ ...archiveBackground, color: palette.text, padding: "70px 78px", fontFamily: THEME.fonts.bodyZh }}>
      <AbsoluteFill style={gridOverlay} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ color: palette.green, fontFamily: THEME.fonts.numbers, fontSize: 28, letterSpacing: 2, marginBottom: 44 }}>{kicker}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: 72, alignItems: "center" }}>
          <div style={{ transform: `translateY(${(1 - intro) * 24}px)`, opacity: intro }}>
            <div style={{ fontFamily: THEME.fonts.headlineZh, fontSize: 84, lineHeight: 1.04, fontWeight: 900, maxWidth: 760 }}>{question}</div>
            <div style={{ marginTop: 34, maxWidth: 860, color: palette.muted, fontSize: 32, lineHeight: 1.5 }}>{answer}</div>
          </div>
          <div style={{ padding: 42, borderRadius: 34, background: palette.panel, border: `1px solid ${palette.line}`, boxShadow: "0 0 60px rgba(98,255,159,0.08)" }}>
            <ConnectorDiagram />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30, color: palette.text, fontSize: 34, fontWeight: 900 }}>
              <span>{leftMetric}</span>
              <span style={{ color: palette.green, opacity: pulse }}>{rightMetric}</span>
            </div>
          </div>
        </div>
      </div>
      <Mascot />
    </AbsoluteFill>
  );
};

export const TechArchiveChapterScene: React.FC<{ chapter: TechArchiveChapter; index: number }> = ({ chapter, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ fps, frame, config: { damping: 16, stiffness: 110 } });
  const x = interpolate(frame, [0, 260], [28, -20], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ ...archiveBackground, color: palette.text, padding: "64px 72px", fontFamily: THEME.fonts.bodyZh }}>
      <AbsoluteFill style={gridOverlay} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.16, fontFamily: THEME.fonts.numbers, fontSize: 260, fontWeight: 900, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {chapter.year}
      </div>
      <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 54 }}>
        <div style={{ transform: `translateX(${x}px)`, opacity: intro }}>
          <div style={{ color: palette.green, fontFamily: THEME.fonts.numbers, fontSize: 86, fontWeight: 900 }}>{chapter.year}</div>
          <div style={{ marginTop: 28, fontSize: 62, lineHeight: 1.08, fontWeight: 900 }}>{chapter.title}</div>
          <div style={{ marginTop: 24, color: palette.muted, fontSize: 30, lineHeight: 1.5 }}>{chapter.subtitle}</div>
          <div style={{ marginTop: 42 }}>
            {index === 1 ? <DocCard title="USB Type-C Specification" /> : <ConnectorDiagram active={index === 0 ? "left" : "both"} />}
          </div>
        </div>
        <div style={{ display: "grid", gap: 22, alignContent: "center" }}>
          {chapter.evidence.map((item, itemIndex) => {
            const itemIntro = spring({ fps, frame: frame - itemIndex * 15, config: { damping: 16, stiffness: 120 } });
            return (
              <div
                key={item.title}
                style={{
                  padding: "28px 30px",
                  minHeight: 164,
                  borderRadius: 26,
                  border: `1px solid ${palette.line}`,
                  background: itemIndex === 0 ? palette.panelStrong : palette.panel,
                  boxShadow: "0 18px 42px rgba(0,0,0,0.26)",
                  opacity: itemIntro,
                  transform: `translateY(${(1 - itemIntro) * 24}px)`,
                }}
              >
                <div style={{ color: itemIndex === 0 ? palette.green : palette.amber, fontFamily: THEME.fonts.numbers, fontSize: 24, marginBottom: 12 }}>
                  0{itemIndex + 1} / {item.label}
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>{item.title}</div>
                <div style={{ color: palette.muted, fontSize: 25, lineHeight: 1.46 }}>{item.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
      <Mascot scale={0.85} />
    </AbsoluteFill>
  );
};

export const TechArchiveCloseScene: React.FC<{ title: string; body: string; tags: string[] }> = ({ title, body, tags }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });

  return (
    <AbsoluteFill style={{ ...archiveBackground, color: palette.text, padding: "86px 92px", fontFamily: THEME.fonts.bodyZh }}>
      <AbsoluteFill style={gridOverlay} />
      <div style={{ position: "relative", zIndex: 2, height: "100%", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 50, alignItems: "center" }}>
        <div style={{ opacity: intro, transform: `translateY(${(1 - intro) * 30}px)` }}>
          <div style={{ color: palette.green, fontFamily: THEME.fonts.numbers, fontSize: 26, letterSpacing: 2, marginBottom: 28 }}>FINAL ARCHIVE NOTE</div>
          <div style={{ fontFamily: THEME.fonts.headlineZh, fontSize: 76, lineHeight: 1.1, fontWeight: 900 }}>{title}</div>
          <div style={{ color: palette.muted, fontSize: 34, lineHeight: 1.5, marginTop: 30 }}>{body}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 42 }}>
            {tags.map((tag) => (
              <div key={tag} style={{ border: `1px solid ${palette.line}`, borderRadius: 999, padding: "12px 18px", color: palette.green, fontSize: 22 }}>
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderRadius: 34, border: `1px solid ${palette.line}`, background: palette.panel, padding: 40 }}>
          <DocCard title="Interface becomes infrastructure" highlight="STANDARD + ECOSYSTEM" />
        </div>
      </div>
      <Mascot scale={1.1} />
    </AbsoluteFill>
  );
};
