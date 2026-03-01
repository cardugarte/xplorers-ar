/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
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
        // ─── Semantic backgrounds ───
        surface: {
          base: "var(--bg-base)",
          subtle: "var(--bg-subtle)",
          muted: "var(--bg-muted)",
        },
        // ─── Semantic text ───
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        // ─── Glass text (hardcoded for contrast guarantee) ───
        "glass-text": {
          primary: {
            light: "#1e2730",
            dark: "#daf0ff",
          },
          secondary: {
            light: "#3f4f5c",
            dark: "#adbcca",
          },
          brand: {
            light: "#175533",
            dark: "#83c29a",
          },
          glaciar: {
            light: "#0871c4",
            dark: "#70caff",
          },
          accent: {
            light: "#b03807",
            dark: "#ffb05a",
          },
        },
      },
      fontFamily: {
        "heading": ["BarlowCondensed_700Bold"],
        "heading-extra": ["BarlowCondensed_800ExtraBold"],
        "heading-semi": ["BarlowCondensed_600SemiBold"],
        "label": ["BarlowSemiCondensed_600SemiBold"],
        "label-italic": ["BarlowSemiCondensed_400Regular_Italic"],
        "body": ["DMSans_400Regular"],
        "body-medium": ["DMSans_500Medium"],
        "body-bold": ["DMSans_700Bold"],
        "body-light": ["DMSans_300Light"],
        "display": ["InstrumentSerif_400Regular"],
        "display-italic": ["InstrumentSerif_400Regular_Italic"],
      },
      borderRadius: {
        "glass": "20px",
        "glass-sm": "14px",
        "glass-xs": "10px",
      },
      boxShadow: {
        "glass-light": "0 1px 0 rgba(255,255,255,0.90) inset, 0 8px 32px rgba(30,39,48,0.10)",
        "glass-dark": "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.40)",
        "brand-glow": "0 0 20px rgba(45,134,83,0.35)",
      },
    },
  },
  plugins: [],
};
