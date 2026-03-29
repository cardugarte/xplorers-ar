import { BarChart2, Heart, Eye, CalendarCheck } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Text, useColorScheme, View } from "react-native";
import { Svg, Polyline } from "react-native-svg";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText, colors } from "@/src/shared/theme/tokens";
import { useCampingAnalytics } from "../useAnalytics";
import { StatCard } from "./StatCard";

const SPARKLINE_W = 120;
const SPARKLINE_H = 36;

const PERIOD_OPTIONS = [
  { label: "7 días",   days: 7 },
  { label: "30 días",  days: 30 },
  { label: "Todo",     days: 365 },
] as const;

interface PeriodSelectorProps {
  selected: number;
  onChange: (days: number) => void;
}

function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
  const dark       = useColorScheme() === "dark";
  const textColors = dark ? glassText.dark : glassText.light;

  return (
    <View className="flex-row gap-2">
      {PERIOD_OPTIONS.map((opt) => {
        const active = opt.days === selected;
        return (
          <GlassView
            key={opt.days}
            level={active ? "andes" : "btn"}
            className="rounded-glass-xs px-3 py-1.5"
          >
            <Text
              className="font-label text-xs"
              style={{ color: active ? textColors.brand : textColors.secondary }}
              onPress={() => onChange(opt.days)}
            >
              {opt.label}
            </Text>
          </GlassView>
        );
      })}
    </View>
  );
}

interface SparklineProps {
  data:   number[];
  width:  number;
  height: number;
}

function Sparkline({ data, width, height }: SparklineProps) {
  const dark = useColorScheme() === "dark";
  const stroke = dark ? colors.andes[400] : colors.andes[600];

  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (v / max) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} stroke={stroke} strokeWidth={2} fill="none" />
    </Svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OwnerDashboardProps {
  campingId: string;
}

export function OwnerDashboard({ campingId }: OwnerDashboardProps) {
  const dark       = useColorScheme() === "dark";
  const textColors = dark ? glassText.dark : glassText.light;

  const [days, setDays] = useState<number>(30);
  const { data, isPending, isError } = useCampingAnalytics(campingId, days);

  const viewCounts = data?.views_by_day.map((d) => d.count) ?? [];

  return (
    <View className="gap-4 px-4 py-4">
      {/* Header row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <BarChart2 size={18} color={textColors.brand} />
          <Text className="font-heading text-base" style={{ color: textColors.primary }}>
            Analytics
          </Text>
        </View>
        <PeriodSelector selected={days} onChange={setDays} />
      </View>

      {/* Loading state */}
      {isPending && (
        <View className="items-center py-8">
          <ActivityIndicator color={textColors.brand} />
        </View>
      )}

      {/* Error state */}
      {isError && (
        <GlassView level="crepusculo" className="rounded-glass p-4">
          <Text className="font-body text-sm" style={{ color: textColors.accent }}>
            No se pudieron cargar los analytics. Intentá de nuevo más tarde.
          </Text>
        </GlassView>
      )}

      {/* Stats grid */}
      {data && (
        <>
          <View className="flex-row gap-3">
            <StatCard
              label="Vistas"
              value={data.total_views}
              icon={Eye}
            />
            <StatCard
              label="Favoritos"
              value={data.total_favorites}
              icon={Heart}
            />
          </View>

          <View className="flex-row gap-3">
            <StatCard
              label="Reservas"
              value={data.total_reservations}
              icon={CalendarCheck}
            />
            {/* Placeholder for future revenue card (Fase 3) */}
            <View className="flex-1" />
          </View>

          {/* Sparkline — views over time */}
          {viewCounts.length >= 2 && (
            <GlassView level="soft" className="rounded-glass p-4">
              <Text
                className="mb-3 font-label text-xs"
                style={{ color: textColors.secondary }}
              >
                Vistas por día
              </Text>
              <Sparkline
                data={viewCounts}
                width={SPARKLINE_W}
                height={SPARKLINE_H}
              />
            </GlassView>
          )}
        </>
      )}
    </View>
  );
}
