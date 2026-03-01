import { BlurView } from "expo-blur";
import { type ComponentProps } from "react";
import { View, useColorScheme, type ViewStyle } from "react-native";

import { glass, BLUR_INTENSITY } from "@/src/shared/theme/glass";

type GlassLevel = keyof typeof glass;

interface GlassViewProps extends Omit<ComponentProps<typeof View>, "style"> {
  level?: GlassLevel;
  blur?: boolean;
  style?: ViewStyle;
}

/**
 * View with glass morphism effect from the Xplorers design system.
 *
 * When `blur` is true, wraps content in expo-blur's BlurView
 * for real backdrop blur on native. When false, uses opaque
 * fallback colors that approximate the glass look.
 *
 * @example
 *   <GlassView level="ultra" blur className="rounded-glass p-4">
 *     <Text>Content over glass</Text>
 *   </GlassView>
 */
export function GlassView({
  level = "mid",
  blur = false,
  style,
  children,
  ...props
}: GlassViewProps) {
  const dark = useColorScheme() === "dark";
  const glassStyle = glass[level](dark);

  if (blur) {
    const blurKey = level === "btn" ? "btn" : level in BLUR_INTENSITY
      ? (level as keyof typeof BLUR_INTENSITY)
      : "mid";
    const intensity = BLUR_INTENSITY[blurKey as keyof typeof BLUR_INTENSITY] ?? BLUR_INTENSITY.mid;

    return (
      <BlurView
        intensity={intensity}
        tint={dark ? "dark" : "light"}
        style={[{ overflow: "hidden" }, style]}
      >
        <View style={[glassStyle, { flex: 1 }]} {...props}>
          {children}
        </View>
      </BlurView>
    );
  }

  return (
    <View style={[glassStyle, style]} {...props}>
      {children}
    </View>
  );
}
