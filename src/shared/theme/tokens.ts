/**
 * Xplorers Design System v3
 * "Patagonia Salvaje + iOS 26 Liquid Glass"
 *
 * REGLA DE ORO:
 *   light mode → glass opaco 0.72–0.82, texto siempre oscuro
 *   dark mode  → glass opaco 0.70–0.75, texto siempre claro
 */

export const colors = {
  // ─── Andes (brand green) ───
  andes: {
    50: "#f0faf4",
    100: "#dcf0e4",
    200: "#b5e0c8",
    300: "#83c29a",
    400: "#50a472",
    500: "#2d8653",
    600: "#1e6b3e",
    700: "#175533",
    800: "#0e3620",
    900: "#0a2816",
  },

  // ─── Glaciar (blue) ───
  glaciar: {
    50: "#eef7ff",
    100: "#d7ebff",
    200: "#b0d9ff",
    300: "#70caff",
    400: "#3aadfa",
    500: "#1490e8",
    600: "#0871c4",
    700: "#065a9e",
    800: "#0a2845",
    900: "#061a2e",
  },

  // ─── Crepúsculo (accent orange) ───
  crepusculo: {
    50: "#fff8f0",
    100: "#ffebd2",
    200: "#ffd5a3",
    300: "#ffb05a",
    400: "#ff8d2a",
    500: "#f56d09",
    600: "#b45004",
    700: "#b03807",
    800: "#501e05",
    900: "#3e1004",
  },
} as const;

export const semantic = {
  light: {
    bg: {
      base: "#fafbfc",
      subtle: "#f1f4f7",
      muted: "#e3eaef",
    },
    text: {
      primary: "#1e2730",
      secondary: "#4e6070",
      tertiary: "#8293a3",
    },
    brand: {
      base: "#2d8653",
      text: "#175533",
    },
    accent: {
      base: "#f56d09",
    },
  },
  dark: {
    bg: {
      base: "#1e2730",
      subtle: "#2f3942",
      muted: "#36424d",
    },
    text: {
      primary: "#daf0ff",
      secondary: "#ccd6df",
      tertiary: "#8293a3",
    },
    brand: {
      base: "#50a472",
      text: "#83c29a",
    },
    accent: {
      base: "#ff8d2a",
    },
  },
} as const;

// Text colors guaranteed WCAG AA over glass surfaces
export const glassText = {
  light: {
    primary: "#1e2730",
    secondary: "#3f4f5c",
    brand: "#175533",
    glaciar: "#0871c4",
    accent: "#b03807",
  },
  dark: {
    primary: "#daf0ff",
    secondary: "#adbcca",
    brand: "#83c29a",
    glaciar: "#70caff",
    accent: "#ffb05a",
  },
} as const;

export type ColorScheme = "light" | "dark";
