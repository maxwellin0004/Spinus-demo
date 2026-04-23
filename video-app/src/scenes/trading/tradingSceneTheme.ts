export type TradingSceneVariant = "dark" | "light";

type TradingScenePalette = {
  background: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentStrong: string;
  border: string;
  borderStrong: string;
  panel: string;
  panelSoft: string;
  panelSolid: string;
  overlay: string;
  chipBackground: string;
  imageOverlay: string;
  shadow: string;
  frame: string;
};

const DARK_PALETTE: TradingScenePalette = {
  background: "linear-gradient(180deg, #080b12 0%, #04060b 100%)",
  textPrimary: "#f7f9ff",
  textSecondary: "rgba(247,249,255,0.84)",
  textMuted: "rgba(247,249,255,0.62)",
  accent: "#ffb04d",
  accentSoft: "rgba(255,176,77,0.08)",
  accentStrong: "#ff6c4a",
  border: "rgba(255,255,255,0.1)",
  borderStrong: "rgba(255,255,255,0.16)",
  panel: "rgba(255,255,255,0.04)",
  panelSoft: "rgba(255,255,255,0.032)",
  panelSolid: "rgba(10,14,22,0.82)",
  overlay: "linear-gradient(90deg, rgba(6,8,14,0.92) 0%, rgba(6,8,14,0.84) 42%, rgba(6,8,14,0.38) 100%)",
  chipBackground: "rgba(8,10,16,0.7)",
  imageOverlay: "linear-gradient(180deg, rgba(6,8,14,0.1) 0%, rgba(6,8,14,0.62) 100%)",
  shadow: "0 24px 80px rgba(0,0,0,0.34)",
  frame: "rgba(255,255,255,0.08)",
};

const LIGHT_PALETTE: TradingScenePalette = {
  background: "linear-gradient(180deg, #f9fbff 0%, #eef4fb 100%)",
  textPrimary: "#112033",
  textSecondary: "rgba(17,32,51,0.86)",
  textMuted: "rgba(17,32,51,0.62)",
  accent: "#2f7df6",
  accentSoft: "rgba(47,125,246,0.10)",
  accentStrong: "#0f5ddb",
  border: "rgba(17,32,51,0.12)",
  borderStrong: "rgba(17,32,51,0.18)",
  panel: "rgba(255,255,255,0.86)",
  panelSoft: "rgba(255,255,255,0.78)",
  panelSolid: "rgba(255,255,255,0.92)",
  overlay: "linear-gradient(90deg, rgba(244,248,255,0.94) 0%, rgba(244,248,255,0.86) 42%, rgba(244,248,255,0.44) 100%)",
  chipBackground: "rgba(255,255,255,0.92)",
  imageOverlay: "linear-gradient(180deg, rgba(244,248,255,0.04) 0%, rgba(244,248,255,0.34) 100%)",
  shadow: "0 24px 80px rgba(39,76,119,0.16)",
  frame: "rgba(17,32,51,0.08)",
};

export const getTradingScenePalette = (variant: TradingSceneVariant = "dark") =>
  variant === "light" ? LIGHT_PALETTE : DARK_PALETTE;
