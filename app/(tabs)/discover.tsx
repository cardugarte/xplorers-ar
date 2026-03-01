import { Search } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CampingCard,
  FilterChips,
  FilterModal,
  SearchInput,
} from "@/src/domains/camping/components";
import { useSearchCampings } from "@/src/domains/camping/hooks";
import { useFilterStore } from "@/src/domains/camping/store";
import type { Camping } from "@/src/domains/camping/types";
import { glassText } from "@/src/shared/theme/tokens";

export default function DiscoverScreen() {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { data: campings, isPending, isFetching, error } = useSearchCampings();

  const hasActiveFilters = useFilterStore(
    (s) =>
      s.searchQuery.length > 0 ||
      s.provinces.length > 0 ||
      s.types.length > 0 ||
      s.requiredAmenities.length > 0,
  );

  return (
    <View
      className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-4 pb-2 pt-3">
        <Text
          className="font-heading text-2xl uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          Explorar
        </Text>
      </View>

      <SearchInput />
      <FilterChips onOpenFilters={() => setFiltersVisible(true)} />

      {/* Content */}
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className="text-center font-body text-base"
            style={{ color: colors.secondary }}
          >
            Error al cargar campings. Intentá de nuevo.
          </Text>
        </View>
      ) : campings && campings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Search size={40} color={colors.secondary} />
          <Text
            className="mt-4 text-center font-body text-base"
            style={{ color: colors.secondary }}
          >
            {hasActiveFilters
              ? "No se encontraron campings con esos filtros."
              : "No hay campings disponibles."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={campings}
          keyExtractor={(item: Camping) => item.id}
          renderItem={({ item }: { item: Camping }) => (
            <CampingCard camping={item} />
          )}
          contentContainerClassName="pt-2 pb-24"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isFetching ? (
              <ActivityIndicator
                size="small"
                color={colors.brand}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
        />
      )}

      <FilterModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
      />
    </View>
  );
}
