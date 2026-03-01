import { Text, View, useColorScheme } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

const PRICE_LABELS: Record<string, string> = {
  tent_per_night: "Carpa / noche",
  car_per_night: "Auto / noche",
  person_per_night: "Persona / noche",
  motorhome_per_night: "Motorhome / noche",
};

function formatPrice(
  amount: number,
  currency: string = "ARS",
): string {
  if (currency === "SAT") return `${amount} SAT`;
  if (currency === "USD") return `US$ ${amount.toLocaleString()}`;
  return `$ ${amount.toLocaleString()}`;
}

interface CampingPricesSectionProps {
  prices: Record<string, number | string> | null;
}

export function CampingPricesSection({ prices }: CampingPricesSectionProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  if (!prices) return null;

  const currency = typeof prices.currency === "string" ? prices.currency : "ARS";
  const updatedAt = typeof prices.updated_at === "string" ? prices.updated_at : null;

  const priceEntries = Object.entries(prices).filter(
    ([key, val]) =>
      key !== "currency" && key !== "updated_at" && typeof val === "number",
  );

  if (priceEntries.length === 0) return null;

  return (
    <View className="px-4">
      <Text
        className="mb-3 font-label text-sm uppercase tracking-wider"
        style={{ color: colors.secondary }}
      >
        Precios
      </Text>
      <GlassView level="mid" className="rounded-glass p-4">
        {priceEntries.map(([key, val], i) => (
          <View
            key={key}
            className={`flex-row items-center justify-between ${i > 0 ? "mt-3 border-t border-[#e3eaef] pt-3 dark:border-[#36424d]" : ""}`}
          >
            <Text
              className="font-body text-sm"
              style={{ color: colors.secondary }}
            >
              {PRICE_LABELS[key] ?? key}
            </Text>
            <Text
              className="font-heading text-base"
              style={{ color: colors.primary }}
            >
              {formatPrice(val as number, currency)}
            </Text>
          </View>
        ))}
        {updatedAt && (
          <Text
            className="mt-3 font-body text-xs"
            style={{ color: colors.secondary, opacity: 0.7 }}
          >
            Precios al{" "}
            {new Date(updatedAt).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        )}
      </GlassView>
    </View>
  );
}
