/**
 * BadgeGrid — displays a user's earned badges in a responsive grid.
 *
 * Shows all BADGE_DEFINITIONS as slots. Earned badges are highlighted,
 * unearned badges are shown as locked (dimmed) placeholders.
 * Uses local-first principle: renders from cache, no loading spinners.
 */

import { Text, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { ALL_BADGE_DEFINITIONS } from "./definitions";
import type { BadgeDefinition } from "./definitions";
import { BadgeDisplay } from "./BadgeDisplay";
import type { EarnedBadge } from "./useBadges";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BadgeGridProps {
  /** Badges the user has earned (from useUserBadges) */
  earnedBadges: EarnedBadge[];
  /** Show all badge slots including unearned ones */
  showLocked?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BadgeGrid({ earnedBadges, showLocked = true }: BadgeGridProps) {
  // Build a dTag → EarnedBadge lookup for O(1) slot resolution
  const earnedByDTag = new Map<string, EarnedBadge>();
  for (const badge of earnedBadges) {
    earnedByDTag.set(badge.definition.dTag, badge);
  }

  const slots: BadgeSlot[] = ALL_BADGE_DEFINITIONS.map((def) => {
    const earned = earnedByDTag.get(def.dTag);
    return earned ? { kind: "earned", earned, definition: def } : { kind: "locked", definition: def };
  });

  const visibleSlots = showLocked
    ? slots
    : slots.filter((s): s is EarnedSlot => s.kind === "earned");

  if (visibleSlots.length === 0) {
    return <EmptyState />;
  }

  return (
    <View className="gap-3">
      {/* Earned badges — full card display */}
      {earnedBadges.length > 0 && (
        <View className="gap-2">
          <Text className="font-heading text-sm font-semibold text-andes-700 dark:text-andes-300 px-1">
            Badges obtenidos ({earnedBadges.length})
          </Text>
          {slots
            .filter((s): s is EarnedSlot => s.kind === "earned")
            .map((slot) => (
              <BadgeDisplay key={slot.earned.awardEventId} badge={slot.earned} />
            ))}
        </View>
      )}

      {/* Locked badges — compact grid */}
      {showLocked && slots.some((s) => s.kind === "locked") && (
        <View className="gap-2">
          <Text className="font-heading text-sm font-semibold text-andes-500 dark:text-andes-500 px-1">
            Por desbloquear
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {slots
              .filter((s): s is LockedSlot => s.kind === "locked")
              .map((slot) => (
                <LockedBadgeCard key={slot.definition.dTag} definition={slot.definition} />
              ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Locked badge placeholder
// ---------------------------------------------------------------------------

interface LockedBadgeCardProps {
  definition: BadgeDefinition;
}

function LockedBadgeCard({ definition }: LockedBadgeCardProps) {
  return (
    <GlassView
      level="soft"
      className="items-center justify-center rounded-glass-sm p-3 gap-1 opacity-40"
      style={{ width: 80 }}
    >
      <Text className="text-3xl grayscale">{definition.emoji}</Text>
      <Text
        className="font-label text-xs text-center text-andes-600 dark:text-andes-400"
        numberOfLines={2}
      >
        {definition.name}
      </Text>
    </GlassView>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <GlassView level="soft" className="items-center justify-center py-10 rounded-glass gap-3">
      <Text className="text-4xl">🏕️</Text>
      <Text className="font-heading text-base font-semibold text-andes-800 dark:text-andes-200">
        Todavía no tenés badges
      </Text>
      <Text className="font-body text-sm text-center text-andes-600 dark:text-andes-400 px-8">
        Explorá campings, hacé check-ins y dejá reviews para ganar tus primeros badges.
      </Text>
    </GlassView>
  );
}

// ---------------------------------------------------------------------------
// Slot types (discriminated union)
// ---------------------------------------------------------------------------

interface EarnedSlot {
  kind: "earned";
  earned: EarnedBadge;
  definition: BadgeDefinition;
}

interface LockedSlot {
  kind: "locked";
  definition: BadgeDefinition;
}

type BadgeSlot = EarnedSlot | LockedSlot;
