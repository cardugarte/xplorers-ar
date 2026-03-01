import { SlidersHorizontal } from "lucide-react-native";
import { Pressable, ScrollView, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import { useFilterStore } from "../store";
import { CAMPING_TYPE_LABELS, CampingTypeSchema } from "../types";

import type { CampingType } from "../types";

interface FilterChipsProps {
  onOpenFilters: () => void;
}

export function FilterChips({ onOpenFilters }: FilterChipsProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const selectedTypes = useFilterStore((s) => s.types);
  const provinces = useFilterStore((s) => s.provinces);
  const amenities = useFilterStore((s) => s.requiredAmenities);
  const toggleType = useFilterStore((s) => s.toggleType);

  const activeFilterCount = provinces.length + amenities.length;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2"
    >
      <Pressable onPress={onOpenFilters}>
        <GlassView
          level={activeFilterCount > 0 ? "andes" : "btn"}
          className="flex-row items-center rounded-glass-xs px-3 py-1.5"
        >
          <SlidersHorizontal size={14} color={activeFilterCount > 0 ? colors.brand : colors.secondary} />
          <Text
            className="ml-1.5 font-label text-sm"
            style={{ color: activeFilterCount > 0 ? colors.brand : colors.secondary }}
          >
            Filtros
          </Text>
          {activeFilterCount > 0 && (
            <View className="ml-1.5 h-5 w-5 items-center justify-center rounded-full bg-andes-500 dark:bg-andes-400">
              <Text className="font-label text-xs text-white dark:text-[#0e3620]">
                {activeFilterCount}
              </Text>
            </View>
          )}
        </GlassView>
      </Pressable>

      {CampingTypeSchema.options.map((type: CampingType) => {
        const active = selectedTypes.includes(type);
        return (
          <Pressable key={type} onPress={() => toggleType(type)}>
            <GlassView
              level={active ? "andes" : "btn"}
              className="rounded-glass-xs px-3 py-1.5"
            >
              <Text
                className="font-label text-sm"
                style={{ color: active ? colors.brand : colors.secondary }}
              >
                {CAMPING_TYPE_LABELS[type]}
              </Text>
            </GlassView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
