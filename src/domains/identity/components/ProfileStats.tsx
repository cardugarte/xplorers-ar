import { MapPin, Star, Award } from "lucide-react-native";
import { Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

export interface ProfileStatsData {
  checkIns: number;
  reviews: number;
  badges: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  return (
    <GlassView level="mid" className="flex-1 items-center rounded-glass py-4">
      <View className="mb-1">{icon}</View>
      <Text
        className="font-heading text-xl"
        style={{ color: colors.primary }}
      >
        {value}
      </Text>
      <Text
        className="font-label text-xs"
        style={{ color: colors.secondary }}
      >
        {label}
      </Text>
    </GlassView>
  );
}

interface ProfileStatsProps {
  stats: ProfileStatsData;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  return (
    <View className="mx-4 flex-row gap-2">
      <StatCard
        icon={<MapPin size={16} color={colors.glaciar} />}
        value={stats.checkIns}
        label="Check-ins"
      />
      <StatCard
        icon={<Star size={16} color={colors.accent} />}
        value={stats.reviews}
        label="Reviews"
      />
      <StatCard
        icon={<Award size={16} color={colors.brand} />}
        value={stats.badges}
        label="Badges"
      />
    </View>
  );
}
