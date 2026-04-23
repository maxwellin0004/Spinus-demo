import { THEME } from "../theme/tokens";

export type ReferencePalette = {
  background: string;
  accent: string;
  accentRgb: string;
  textPrimary: string;
  textMuted: string;
  frame: string;
};

export const DEFAULT_REFERENCE_PALETTE: ReferencePalette = {
  background: THEME.backgrounds.base,
  accent: THEME.colors.accent,
  accentRgb: "255,122,69",
  textPrimary: THEME.colors.textPrimary,
  textMuted: THEME.colors.textMuted,
  frame: THEME.colors.frame,
};

export const DARK_HUD_BLUE_PALETTE: ReferencePalette = {
  background:
    "radial-gradient(circle at top left, rgba(76,185,255,0.22), transparent 28%), linear-gradient(180deg, #07111f 0%, #071629 58%, #040914 100%)",
  accent: "#4cb9ff",
  accentRgb: "76,185,255",
  textPrimary: "#f4fbff",
  textMuted: "rgba(244, 251, 255, 0.74)",
  frame: "rgba(188, 226, 255, 0.22)",
};

export const withPalette = (
  palette?: Partial<ReferencePalette>,
): ReferencePalette => {
  return {
    ...DEFAULT_REFERENCE_PALETTE,
    ...palette,
  };
};
