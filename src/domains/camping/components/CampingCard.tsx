import { useRouter } from "expo-router";
import { MapPin } from "lucide-react-native";
import { Pressable, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import type { CampingWithDistance } from "../hooks";
import { AMENITY_LABELS, CAMPING_TYPE_LABELS } from "../types";
import type { AmenityKey } from "../types";

const MAX_AMENITY_CHIPS = 4;

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

interface CampingCardProps {
  camping: CampingWithDistance;
}

export function CampingCard({ camping }: CampingCardProps) {
  const router = useRouter();
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const activeAmenities = (
    Object.entries(camping.amenities) as [AmenityKey, boolean | undefined][]
  ).filter(([, v]) => v === true);

  const visibleAmenities = activeAmenities.slice(0, MAX_AMENITY_CHIPS);
  const extraCount = activeAmenities.length - MAX_AMENITY_CHIPS;

  return (
    <Pressable
      onPress={() => router.push(`/camping/${camping.id}` as never)}
    >
      <GlassView level="mid" className="mx-4 mb-3 rounded-glass p-4">
        {/* Name + type badge */}
        <View className="flex-row items-center gap-2">
          <Text
            className="flex-1 font-heading text-lg"
            style={{ color: colors.primary }}
            numberOfLines={1}
          >
            {camping.name}
          </Text>
          {camping.type && (
            <GlassView level="andes" className="rounded-glass-xs px-2 py-0.5">
              <Text
                className="font-label text-xs"
                style={{ color: colors.brand }}
              >
                {CAMPING_TYPE_LABELS[camping.type]}
              </Text>
            </GlassView>
          )}
        </View>

        {/* Province */}
        <View className="mt-1.5 flex-row items-center">
          <MapPin size={13} color={colors.secondary} />
          <Text
            className="ml-1 font-body text-sm"
            style={{ color: colors.secondary }}
          >
            {camping.province}
          </Text>
          {camping.distance_km != null && (
            <Text
              className="ml-1 font-label text-sm"
              style={{ color: colors.glaciar }}
            >
              · {formatDistance(camping.distance_km)}
            </Text>
          )}
        </View>

        {/* Amenities preview */}
        {activeAmenities.length > 0 && (
          <View className="mt-2.5 flex-row flex-wrap gap-1.5">
            {visibleAmenities.map(([key]) => (
              <View
                key={key}
                className="rounded-full bg-[#e3eaef] px-2 py-0.5 dark:bg-[#36424d]"
              >
                <Text
                  className="font-label text-xs"
                  style={{ color: colors.secondary }}
                >
                  {AMENITY_LABELS[key]}
                </Text>
              </View>
            ))}
            {extraCount > 0 && (
              <View className="rounded-full bg-[#e3eaef] px-2 py-0.5 dark:bg-[#36424d]">
                <Text
                  className="font-label text-xs"
                  style={{ color: colors.secondary }}
                >
                  +{extraCount}
                </Text>
              </View>
            )}
          </View>
        )}
      </GlassView>
    </Pressable>
  );
}
