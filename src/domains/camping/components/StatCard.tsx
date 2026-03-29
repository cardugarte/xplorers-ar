import { type LucideIcon } from "lucide-react-native";
import { Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

interface StatCardProps {
  label: string;
  value: string | number;
  icon:  LucideIcon;
  /** Optional trend label, e.g. "+12% vs semana anterior" */
  trend?: string;
}

/**
 * Glass card that displays a single metric for the owner analytics dashboard.
 *
 * @example
 *   <StatCard label="Vistas" value={342} icon={Eye} trend="+8%" />
 */
export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  const dark   = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  return (
    <GlassView level="mid" className="flex-1 rounded-glass p-4">
      {/* Icon + label row */}
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={colors.brand} />
        <Text
          className="font-label text-xs"
          style={{ color: colors.secondary }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>

      {/* Metric value */}
      <Text
        className="mt-2 font-heading text-2xl"
        style={{ color: colors.primary }}
        numberOfLines={1}
      >
        {typeof value === "number" ? value.toLocaleString("es-AR") : value}
      </Text>

      {/* Optional trend */}
      {trend ? (
        <Text
          className="mt-0.5 font-label text-xs"
          style={{ color: colors.glaciar }}
          numberOfLines={1}
        >
          {trend}
        </Text>
      ) : null}
    </GlassView>
  );
}
