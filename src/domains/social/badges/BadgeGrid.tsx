import { Award } from "lucide-react-native";
import { ScrollView, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import { BADGES, type Badge } from "@/src/domains/social/types";

interface BadgeItemProps {
  badge: (typeof BADGES)[keyof typeof BADGES];
  earned?: boolean;
}

function BadgeItem({ badge, earned = false }: BadgeItemProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  return (
    <GlassView
      level={earned ? "andes" : "soft"}
      className="m-1.5 w-24 items-center rounded-glass p-3"
      style={{ opacity: earned ? 1 : 0.45 }}
    >
      <View
        className="mb-2 h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: earned
            ? dark
              ? "rgba(80,164,114,0.25)"
              : "rgba(45,134,83,0.15)"
            : dark
              ? "rgba(255,255,255,0.08)"
              : "rgba(30,39,48,0.08)",
        }}
      >
        <Award
          size={24}
          color={earned ? colors.brand : colors.secondary}
        />
      </View>
      <Text
        className="text-center font-label text-xs"
        style={{ color: earned ? colors.brand : colors.secondary }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </GlassView>
  );
}

interface BadgeGridProps {
  /** npubs of earned badge d_tags — for now a stub until Nostr integration in Fase 2 */
  earnedDTags?: string[];
}

export function BadgeGrid({ earnedDTags = [] }: BadgeGridProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const allBadges = Object.values(BADGES);
  const hasAny = earnedDTags.length > 0;

  return (
    <View>
      <View className="mb-3 flex-row items-center gap-2 px-4">
        <Award size={16} color={colors.brand} />
        <Text
          className="font-heading text-sm uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          Badges
        </Text>
        {hasAny && (
          <GlassView level="andes" className="rounded-full px-2 py-0.5">
            <Text className="font-label text-xs" style={{ color: colors.brand }}>
              {earnedDTags.length}/{allBadges.length}
            </Text>
          </GlassView>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      >
        {allBadges.map((badge) => (
          <BadgeItem
            key={badge.d_tag}
            badge={badge}
            earned={earnedDTags.includes(badge.d_tag)}
          />
        ))}
      </ScrollView>

      {!hasAny && (
        <Text
          className="mt-2 px-4 font-body text-xs"
          style={{ color: dark ? glassText.dark.secondary : glassText.light.secondary }}
        >
          Completá check-ins y reviews para desbloquear badges
        </Text>
      )}
    </View>
  );
}
