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
  SortPicker,
} from "@/src/domains/camping/components";
import { useSearchCampings } from "@/src/domains/camping/hooks";
import type { CampingWithDistance } from "@/src/domains/camping/hooks";
import { useFilterStore } from "@/src/domains/camping/store";
import { glassText } from "@/src/shared/theme/tokens";

export default function DiscoverScreen() {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();
  const [filtersVisible, setFiltersVisible] = useState(false);

  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useSearchCampings();

  const campings = data?.pages.flat() ?? [];

  const hasActiveFilters = useFilterStore(
    (s) =>
      s.searchQuery.length > 0 ||
      s.provinces.length > 0 ||
      s.types.length > 0 ||
      s.requiredAmenities.length > 0,
  );

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

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
      <SortPicker />

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
      ) : campings.length === 0 ? (
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
          keyExtractor={(item: CampingWithDistance) => item.id}
          renderItem={({ item }: { item: CampingWithDistance }) => (
            <CampingCard camping={item} />
          )}
          contentContainerClassName="pt-2 pb-24"
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={refetch}
          ListFooterComponent={
            isFetchingNextPage ? (
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
