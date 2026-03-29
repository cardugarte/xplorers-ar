import { CalendarDays, Users, Zap } from "lucide-react-native";
import { Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

interface BookingSummaryProps {
  campingName: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  prices: Record<string, number> | null | undefined;
}

function calculateNights(checkIn: Date, checkOut: Date): number {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

export function BookingSummary({
  campingName,
  checkIn,
  checkOut,
  guests,
  prices,
}: BookingSummaryProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const nights = calculateNights(checkIn, checkOut);
  const borderColor = dark ? "#36424d" : "#e3eaef";

  const perNight: number = prices?.per_night ?? 0;
  const perPerson: number = prices?.per_person ?? 0;
  const hasPrice = perNight > 0 || perPerson > 0;
  const totalARS = hasPrice
    ? (perNight + perPerson * guests) * nights
    : null;

  return (
    <GlassView
      level="soft"
      className="rounded-glass-sm p-4 gap-4"
      style={{ borderWidth: 1, borderColor }}
    >
      {/* Camping name */}
      <Text className="font-heading text-base" style={{ color: colors.primary }} numberOfLines={2}>
        {campingName}
      </Text>

      {/* Date row */}
      <View className="flex-row items-center gap-2">
        <CalendarDays size={15} color={colors.brand} />
        <Text className="font-body text-sm flex-1" style={{ color: colors.primary }}>
          {formatDateShort(checkIn)} → {formatDateShort(checkOut)}
        </Text>
        <Text className="font-label text-xs" style={{ color: colors.secondary }}>
          {nights} {nights === 1 ? "noche" : "noches"}
        </Text>
      </View>

      {/* Guests row */}
      <View className="flex-row items-center gap-2">
        <Users size={15} color={colors.brand} />
        <Text className="font-body text-sm flex-1" style={{ color: colors.primary }}>
          {guests} {guests === 1 ? "persona" : "personas"}
        </Text>
      </View>

      {/* Price breakdown */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: borderColor,
          paddingTop: 12,
          gap: 6,
        }}
      >
        {hasPrice && perNight > 0 && (
          <View className="flex-row justify-between">
            <Text className="font-body text-sm" style={{ color: colors.secondary }}>
              {formatARS(perNight)} × {nights} {nights === 1 ? "noche" : "noches"}
            </Text>
            <Text className="font-body text-sm" style={{ color: colors.primary }}>
              {formatARS(perNight * nights)}
            </Text>
          </View>
        )}
        {hasPrice && perPerson > 0 && (
          <View className="flex-row justify-between">
            <Text className="font-body text-sm" style={{ color: colors.secondary }}>
              {formatARS(perPerson)} × {guests} {guests === 1 ? "persona" : "personas"} × {nights} {nights === 1 ? "noche" : "noches"}
            </Text>
            <Text className="font-body text-sm" style={{ color: colors.primary }}>
              {formatARS(perPerson * guests * nights)}
            </Text>
          </View>
        )}

        {/* Total */}
        <View className="flex-row justify-between mt-1 items-center">
          <Text className="font-heading text-base" style={{ color: colors.primary }}>
            Total
          </Text>
          {totalARS !== null ? (
            <View className="items-end">
              <Text className="font-heading text-base" style={{ color: colors.brand }}>
                {formatARS(totalARS)}
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <Zap size={11} color={colors.secondary} />
                <Text className="font-label text-xs" style={{ color: colors.secondary }}>
                  Conversión a sats disponible en Fase 3
                </Text>
              </View>
            </View>
          ) : (
            <Text className="font-body text-sm" style={{ color: colors.secondary }}>
              Consultar directamente
            </Text>
          )}
        </View>
      </View>
    </GlassView>
  );
}
