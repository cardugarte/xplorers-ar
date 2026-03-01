import { Text, View, useColorScheme } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import { AMENITY_LABELS, type AmenityKey } from "../types";

interface CampingAmenitiesGridProps {
  amenities: Record<string, boolean>;
}

export function CampingAmenitiesGrid({ amenities }: CampingAmenitiesGridProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  return (
    <View className="px-4">
      <Text
        className="mb-3 font-label text-sm uppercase tracking-wider"
        style={{ color: colors.secondary }}
      >
        Servicios
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {(Object.keys(AMENITY_LABELS) as AmenityKey[]).map((key) => {
          const active = amenities[key] === true;
          return (
            <GlassView
              key={key}
              level={active ? "andes" : "btn"}
              className="w-[31%] items-center rounded-glass-xs px-2 py-2.5"
              style={active ? undefined : { opacity: 0.5 }}
            >
              <Text
                className="text-center font-label text-xs"
                style={{
                  color: active ? colors.brand : colors.secondary,
                }}
              >
                {AMENITY_LABELS[key]}
              </Text>
            </GlassView>
          );
        })}
      </View>
    </View>
  );
}
