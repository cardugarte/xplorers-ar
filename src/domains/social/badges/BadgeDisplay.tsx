/**
 * BadgeDisplay — single NIP-58 badge card.
 *
 * Shows emoji, name, description, and award timestamp.
 * Uses GlassView + NativeWind className only (no StyleSheet).
 */

import { Text, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import type { EarnedBadge } from "./useBadges";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BadgeDisplayProps {
  badge: EarnedBadge;
  /** Show compact variant (emoji + name only, no description/date) */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BadgeDisplay({ badge, compact = false }: BadgeDisplayProps) {
  const { definition, awardedAt } = badge;

  const formattedDate = formatAwardDate(awardedAt);

  if (compact) {
    return (
      <GlassView
        level="soft"
        className="items-center justify-center rounded-glass-sm p-3 gap-1"
      >
        <Text className="text-3xl">{definition.emoji}</Text>
        <Text
          className="font-label text-xs font-semibold text-center text-andes-800 dark:text-andes-200"
          numberOfLines={2}
        >
          {definition.name}
        </Text>
      </GlassView>
    );
  }

  return (
    <GlassView
      level="soft"
      className="flex-row items-center gap-4 rounded-glass p-4"
    >
      {/* Emoji badge icon */}
      <View className="items-center justify-center w-14 h-14 rounded-glass-xs bg-andes-50 dark:bg-andes-900">
        <Text className="text-4xl">{definition.emoji}</Text>
      </View>

      {/* Badge info */}
      <View className="flex-1 gap-1">
        <Text className="font-heading text-base font-semibold text-andes-900 dark:text-andes-100">
          {definition.name}
        </Text>
        <Text
          className="font-body text-sm text-andes-700 dark:text-andes-300"
          numberOfLines={2}
        >
          {definition.description}
        </Text>
        {awardedAt > 0 && (
          <Text className="font-label text-xs text-andes-500 dark:text-andes-400 mt-1">
            Obtenido el {formattedDate}
          </Text>
        )}
      </View>
    </GlassView>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAwardDate(unixSeconds: number): string {
  if (!unixSeconds) return "";
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
