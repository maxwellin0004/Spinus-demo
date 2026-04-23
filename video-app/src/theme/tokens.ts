export const THEME = {
  fonts: {
    headlineEn: '"BebasNeue", sans-serif',
    headlineZh: '"NotoSansSC", sans-serif',
    bodyZh: '"NotoSansSC", sans-serif',
    bodyEn: '"SourceSans3", sans-serif',
    ui: '"SourceSans3", sans-serif',
    numbers: '"Orbitron", sans-serif',
  },
  colors: {
    background: "#050816",
    backgroundSoft: "#0b1022",
    accent: "#ff7a45",
    textPrimary: "#f7f9ff",
    textMuted: "rgba(247, 249, 255, 0.72)",
    frame: "rgba(255, 255, 255, 0.16)",
  },
  backgrounds: {
    base:
      "radial-gradient(circle at top left, rgba(255,122,69,0.2), transparent 28%), linear-gradient(180deg, #0a1020 0%, #050816 60%, #03050d 100%)",
  },
  spacing: {
    safeX: 84,
    safeY: 96,
  },
} as const;
