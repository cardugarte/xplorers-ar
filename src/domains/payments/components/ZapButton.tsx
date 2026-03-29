import { Pressable, Text, useColorScheme } from "react-native";
import { Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { glassText } from "@/src/shared/theme/tokens";

interface ZapButtonProps {
  /** Total sats received (displayed next to the icon) */
  totalSats?: number;
  /** Whether the current user has already zapped */
  hasZapped?: boolean;
  /** Disabled when wallet not connected or zap in progress */
  disabled?: boolean;
  onPress: () => void;
}

/**
 * Lightning bolt button for initiating a zap.
 * Shows accumulated zap total when available.
 */
export function ZapButton({
  totalSats,
  hasZapped = false,
  disabled = false,
  onPress,
}: ZapButtonProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const zapColor = hasZapped
    ? "#f59e0b" // amber when already zapped
    : colors.secondary;

  const formatSats = (sats: number): string => {
    if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(1)}M`;
    if (sats >= 1_000) return `${(sats / 1_000).toFixed(1)}k`;
    return String(sats);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{
        backgroundColor: hasZapped
          ? dark
            ? "rgba(245,158,11,0.15)"
            : "rgba(245,158,11,0.1)"
          : "transparent",
        opacity: disabled ? 0.4 : 1,
      }}
      hitSlop={8}
    >
      <Zap
        size={16}
        color={zapColor}
        fill={hasZapped ? zapColor : "transparent"}
      />
      {totalSats != null && totalSats > 0 && (
        <Text
          className="font-label text-xs"
          style={{ color: zapColor }}
        >
          {formatSats(totalSats)}
        </Text>
      )}
    </Pressable>
  );
}
