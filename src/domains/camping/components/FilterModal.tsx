import { X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import { useFilterStore } from "../store";
import {
  AMENITY_LABELS,
  PROVINCES,
  type AmenityKey,
  type Province,
} from "../types";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FilterModal({ visible, onClose }: FilterModalProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  const provinces = useFilterStore((s) => s.provinces);
  const requiredAmenities = useFilterStore((s) => s.requiredAmenities);
  const toggleProvince = useFilterStore((s) => s.toggleProvince);
  const toggleAmenity = useFilterStore((s) => s.toggleAmenity);
  const clearFilters = useFilterStore((s) => s.clearFilters);

  const hasActiveFilters = provinces.length > 0 || requiredAmenities.length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]"
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text
            className="font-heading text-xl uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            Filtros
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <View className="rounded-full bg-[#e3eaef] p-1.5 dark:bg-[#36424d]">
              <X size={18} color={colors.secondary} />
            </View>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-8"
          showsVerticalScrollIndicator={false}
        >
          {/* Provinces */}
          <Text
            className="mb-2 mt-4 font-label text-sm uppercase tracking-wider"
            style={{ color: colors.secondary }}
          >
            Provincia
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PROVINCES.map((province: Province) => {
              const active = provinces.includes(province);
              return (
                <Pressable
                  key={province}
                  onPress={() => toggleProvince(province)}
                >
                  <GlassView
                    level={active ? "andes" : "btn"}
                    className="rounded-glass-xs px-3 py-1.5"
                  >
                    <Text
                      className="font-label text-sm"
                      style={{
                        color: active ? colors.brand : colors.secondary,
                      }}
                    >
                      {province}
                    </Text>
                  </GlassView>
                </Pressable>
              );
            })}
          </View>

          {/* Amenities */}
          <Text
            className="mb-2 mt-6 font-label text-sm uppercase tracking-wider"
            style={{ color: colors.secondary }}
          >
            Servicios
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(Object.keys(AMENITY_LABELS) as AmenityKey[]).map((key) => {
              const active = requiredAmenities.includes(key);
              return (
                <Pressable key={key} onPress={() => toggleAmenity(key)}>
                  <GlassView
                    level={active ? "andes" : "btn"}
                    className="rounded-glass-xs px-3 py-1.5"
                  >
                    <Text
                      className="font-label text-sm"
                      style={{
                        color: active ? colors.brand : colors.secondary,
                      }}
                    >
                      {AMENITY_LABELS[key]}
                    </Text>
                  </GlassView>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          className="flex-row gap-3 border-t border-[#e3eaef] px-4 py-3 dark:border-[#36424d]"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {hasActiveFilters && (
            <Pressable
              className="flex-1 items-center rounded-glass-sm bg-[#e3eaef] py-3 dark:bg-[#36424d]"
              onPress={() => {
                clearFilters();
              }}
            >
              <Text
                className="font-label text-sm uppercase tracking-wide"
                style={{ color: colors.secondary }}
              >
                Limpiar
              </Text>
            </Pressable>
          )}
          <Pressable
            className="flex-1 items-center rounded-glass-sm bg-andes-500 py-3 dark:bg-andes-400"
            onPress={onClose}
          >
            <Text className="font-label text-sm uppercase tracking-wide text-white dark:text-[#0e3620]">
              Aplicar
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
