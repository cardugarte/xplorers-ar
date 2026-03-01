import type { ViewStyle } from "react-native";

/**
 * Glass effect styles for React Native.
 *
 * On native, true backdrop-filter isn't available.
 * Use these as background colors for views, combined with
 * expo-blur's BlurView for actual blur effects.
 *
 * Usage:
 *   <BlurView intensity={40} tint={dark ? "dark" : "light"}>
 *     <View style={glass.ultra(dark)} />
 *   </BlurView>
 *
 * Or without blur (opaque fallback):
 *   <View style={glass.ultra(dark)} />
 */

type GlassLevel = (dark: boolean) => ViewStyle;

export const glass = {
  ultra: ((dark) => ({
    backgroundColor: dark ? "rgba(22,30,38,0.72)" : "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: dark ? "rgba(255,255,255,0.09)" : "rgba(30,39,48,0.10)",
  })) satisfies GlassLevel,

  mid: ((dark) => ({
    backgroundColor: dark ? "rgba(35,45,55,0.75)" : "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: dark ? "rgba(255,255,255,0.07)" : "rgba(30,39,48,0.09)",
  })) satisfies GlassLevel,

  soft: ((dark) => ({
    backgroundColor: dark ? "rgba(50,63,74,0.70)" : "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(30,39,48,0.08)",
  })) satisfies GlassLevel,

  andes: ((dark) => ({
    backgroundColor: dark ? "rgba(20,60,35,0.75)" : "rgba(220,240,228,0.82)",
    borderWidth: 1,
    borderColor: dark ? "rgba(80,164,114,0.18)" : "rgba(30,100,60,0.18)",
  })) satisfies GlassLevel,

  glaciar: ((dark) => ({
    backgroundColor: dark ? "rgba(8,40,75,0.75)" : "rgba(215,235,255,0.82)",
    borderWidth: 1,
    borderColor: dark ? "rgba(58,173,250,0.18)" : "rgba(8,113,196,0.18)",
  })) satisfies GlassLevel,

  crepusculo: ((dark) => ({
    backgroundColor: dark ? "rgba(80,30,5,0.75)" : "rgba(255,235,210,0.82)",
    borderWidth: 1,
    borderColor: dark ? "rgba(255,141,42,0.18)" : "rgba(180,80,4,0.18)",
  })) satisfies GlassLevel,

  btn: ((dark) => ({
    backgroundColor: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.60)",
    borderWidth: 1,
    borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(30,39,48,0.12)",
  })) satisfies GlassLevel,
} as const;

// Blur intensities matching the CSS blur() values
export const BLUR_INTENSITY = {
  ultra: 40,
  mid: 24,
  soft: 12,
  tint: 20,
  btn: 16,
} as const;
