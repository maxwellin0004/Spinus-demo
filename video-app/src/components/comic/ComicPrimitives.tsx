import React from "react";
import { Img, staticFile } from "remotion";

type CharacterProps = {
  x: number;
  y: number;
  scale?: number;
  mood?: "neutral" | "sad" | "worried" | "tired" | "determined";
  facing?: "left" | "right";
  phone?: boolean;
  hoodie?: string;
};

export const ComicCharacter: React.FC<CharacterProps> = ({
  x,
  y,
  scale = 1,
  mood = "neutral",
  facing = "right",
  phone = true,
  hoodie = "#7350d8",
}) => {
  const dir = facing === "left" ? -1 : 1;
  const mouth =
    mood === "sad"
      ? "M -8 6 Q 0 0 8 6"
      : mood === "worried"
        ? "M -7 4 Q 0 10 7 4"
        : mood === "tired"
          ? "M -7 5 L 7 5"
          : mood === "determined"
            ? "M -7 7 Q 0 3 7 7"
            : "M -6 5 Q 0 9 6 5";

  const eyebrow =
    mood === "worried" || mood === "determined"
      ? { left: "M -22 -8 L -8 -12", right: "M 8 -12 L 22 -8" }
      : { left: "M -22 -10 L -8 -10", right: "M 8 -10 L 22 -10" };

  return (
    <g transform={`translate(${x} ${y}) scale(${dir * scale} ${scale})`}>
      <ellipse cx="0" cy="188" rx="48" ry="10" fill="rgba(17,27,61,0.18)" />
      <path
        d="M -42 148 Q -38 98 -8 76 L 8 76 Q 38 98 42 148 L 44 198 Q 20 220 0 220 Q -20 220 -44 198 Z"
        fill={hoodie}
        stroke="#4a3799"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M -18 84 Q 0 62 18 84" fill="none" stroke="#cbbfff" strokeWidth="4" strokeLinecap="round" />
      <rect x="-16" y="84" width="6" height="34" rx="3" fill="#f3f1ff" />
      <rect x="10" y="84" width="6" height="34" rx="3" fill="#f3f1ff" />
      <circle cx="0" cy="48" r="38" fill="#ffd8c2" stroke="#d2ae98" strokeWidth="4" />
      <path d="M -22 16 Q 2 -6 25 14" fill="#cfbaa8" />
      <ellipse cx="-13" cy="46" rx="4.5" ry="5.5" fill="#1c1c22" />
      <ellipse cx="13" cy="46" rx="4.5" ry="5.5" fill="#1c1c22" />
      <path d={eyebrow.left} fill="none" stroke="#2a2230" strokeWidth="4" strokeLinecap="round" />
      <path d={eyebrow.right} fill="none" stroke="#2a2230" strokeWidth="4" strokeLinecap="round" />
      <path d={mouth} fill="none" stroke="#8e5661" strokeWidth="3" strokeLinecap="round" />
      <path d="M -16 64 Q 0 74 16 64" fill="rgba(255,255,255,0.18)" />
      <path d="M -26 128 L -58 144 L -50 158 L -18 142 Z" fill={hoodie} stroke="#4a3799" strokeWidth="4" strokeLinejoin="round" />
      <path d="M 26 128 L 58 146 L 50 160 L 18 142 Z" fill={hoodie} stroke="#4a3799" strokeWidth="4" strokeLinejoin="round" />
      <path d="M -18 218 L -22 284 L -2 284 L 8 222 Z" fill="#10111a" />
      <path d="M 18 218 L 4 284 L 24 284 L 34 222 Z" fill="#10111a" />
      <rect x="-28" y="282" width="30" height="10" rx="5" fill="#f3f5fa" />
      <rect x="6" y="282" width="30" height="10" rx="5" fill="#f3f5fa" />
      {phone ? (
        <g transform="translate(53 151) rotate(10)">
          <rect x="-12" y="-28" width="24" height="44" rx="6" fill="#262b42" stroke="#97a6ff" strokeWidth="2" />
          <rect x="-8" y="-22" width="16" height="28" rx="4" fill="#dff2ff" />
          <circle cx="0" cy="12" r="2" fill="#9aa7cb" />
        </g>
      ) : null}
    </g>
  );
};

export const RoomBackground: React.FC<{ tone?: "night" | "day" | "desk" }> = ({ tone = "night" }) => {
  const palette =
    tone === "night"
      ? {
          wall: "#313a63",
          floor: "#20253b",
          bed: "#4d5474",
          sheet: "#606c95",
          wood: "#6e5b55",
          window: "#1f2847",
        }
      : tone === "desk"
        ? {
            wall: "#5b6486",
            floor: "#8f7a6d",
            bed: "#6e7694",
            sheet: "#7f90b6",
            wood: "#866a5c",
            window: "#6c88b4",
          }
        : {
            wall: "#b9c4d8",
            floor: "#d2c2b6",
            bed: "#b8bfd2",
            sheet: "#d6deed",
            wood: "#a88774",
            window: "#b9d8f3",
          };

  return (
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width="1920" height="1080" fill={palette.wall} />
      <rect y="790" width="1920" height="290" fill={palette.floor} />
      <rect x="120" y="520" width="460" height="210" rx="8" fill={palette.bed} />
      <rect x="120" y="540" width="420" height="180" rx="10" fill={palette.sheet} />
      <rect x="150" y="470" width="240" height="80" rx="8" fill="#41506e" />
      <rect x="1270" y="240" width="320" height="380" rx="6" fill={palette.window} stroke="#23304d" strokeWidth="10" />
      <line x1="1430" y1="240" x2="1430" y2="620" stroke="#23304d" strokeWidth="8" />
      <line x1="1270" y1="430" x2="1590" y2="430" stroke="#23304d" strokeWidth="8" />
      <circle cx="1525" cy="310" r="42" fill="#f1f4ff" opacity="0.9" />
      <rect x="1210" y="560" width="140" height="180" rx="6" fill={palette.wood} />
      <rect x="1230" y="505" width="70" height="72" rx="10" fill="#5d657b" />
      <path d="M 1244 505 L 1298 505 L 1272 450 Z" fill="#f4e5c6" opacity="0.9" />
      {tone === "desk" ? (
        <>
          <rect x="260" y="430" width="590" height="250" rx="10" fill="#8b6c5e" />
          <rect x="300" y="392" width="280" height="24" rx="12" fill="#7d889d" />
          <rect x="1130" y="260" width="500" height="360" rx="8" fill="#25314f" stroke="#3d4b72" strokeWidth="10" />
        </>
      ) : null}
    </svg>
  );
};

export const ComicCaption: React.FC<{ text: string; width?: number }> = ({ text, width = 1160 }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      bottom: 66,
      transform: "translateX(-50%)",
      width,
      padding: "18px 26px",
      borderRadius: 28,
      background: "rgba(9,10,20,0.72)",
      border: "2px solid rgba(255,255,255,0.16)",
      color: "#ffffff",
      textAlign: "center",
      fontSize: 42,
      lineHeight: 1.3,
      fontWeight: 700,
      textShadow: "0 2px 0 rgba(0,0,0,0.24)",
    }}
  >
    {text}
  </div>
);

export const ThoughtBubble: React.FC<{ x: number; y: number; width: number; lines: readonly string[] }> = ({
  x,
  y,
  width,
  lines,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      padding: "22px 24px",
      borderRadius: 36,
      background: "#ffffff",
      color: "#1d2130",
      border: "4px solid #d7dced",
      boxShadow: "0 14px 40px rgba(20,23,40,0.12)",
      fontSize: 34,
      lineHeight: 1.3,
      fontWeight: 700,
    }}
  >
    {lines.map((line) => (
      <div key={line}>{line}</div>
    ))}
  </div>
);

export const MiniIconCloud: React.FC<{ x: number; y: number; icons: string[] }> = ({ x, y, icons }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", gap: 16, flexWrap: "wrap", width: 320 }}>
    {icons.map((icon) => (
      <div
        key={icon}
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "linear-gradient(180deg, #6b7cff 0%, #4e5fd9 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          boxShadow: "0 10px 28px rgba(36,49,120,0.24)",
        }}
      >
        {icon}
      </div>
    ))}
  </div>
);

export const ComicArtwork: React.FC<{
  src: string;
  scale?: number;
  x?: number;
  y?: number;
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  shadow?: string;
  opacity?: number;
}> = ({ src, scale = 1, x = 0, y = 0, width = "100%", height = "100%", borderRadius = 0, shadow, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      borderRadius,
      opacity,
      boxShadow: shadow,
    }}
  >
    <Img
      src={staticFile(src.replace(/^\/+/, ""))}
      style={{
        width,
        height,
        objectFit: "cover",
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: "center center",
      }}
    />
  </div>
);
