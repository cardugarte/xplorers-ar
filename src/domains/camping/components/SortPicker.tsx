import { ArrowDownAZ, MapPin } from "lucide-react-native";
import { Pressable, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { useUserLocation } from "@/src/shared/hooks/useUserLocation";
import { glassText } from "@/src/shared/theme/tokens";

import { useFilterStore } from "../store";
import type { SortOption } from "../types";

const SORT_OPTIONS: { value: SortOption; label: string; Icon: typeof ArrowDownAZ }[] = [
  { value: "name", label: "Nombre", Icon: ArrowDownAZ },
  { value: "distance", label: "Cercanos", Icon: MapPin },
];

export function SortPicker() {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const sortBy = useFilterStore((s) => s.sortBy);
  const setSortBy = useFilterStore((s) => s.setSortBy);
  const setUserCoords = useFilterStore((s) => s.setUserCoords);
  const { requestLocation } = useUserLocation();

  const handlePress = async (value: SortOption) => {
    if (value === "distance") {
      const coords = await requestLocation();
      if (!coords) return;
      setUserCoords(coords);
    } else {
      setUserCoords(null);
    }
    setSortBy(value);
  };

  return (
    <View className="flex-row items-center gap-2 px-4 py-1.5">
      <Text
        className="font-label text-xs"
        style={{ color: colors.secondary }}
      >
        Ordenar
      </Text>
      {SORT_OPTIONS.map(({ value, label, Icon }) => {
        const active = sortBy === value;
        return (
          <Pressable key={value} onPress={() => handlePress(value)}>
            <GlassView
              level={active ? "glaciar" : "btn"}
              className="flex-row items-center rounded-glass-xs px-3 py-1.5"
            >
              <Icon
                size={14}
                color={active ? colors.glaciar : colors.secondary}
              />
              <Text
                className="ml-1.5 font-label text-sm"
                style={{ color: active ? colors.glaciar : colors.secondary }}
              >
                {label}
              </Text>
            </GlassView>
          </Pressable>
        );
      })}
    </View>
  );
}
