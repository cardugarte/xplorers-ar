import { FlatList, Text, View, useColorScheme } from "react-native";

import { glassText } from "@/src/shared/theme/tokens";

import { useCuratedRoutes, type CuratedRoute } from "../useRoutes";
import { CuratedRouteCard } from "./CuratedRouteCard";

interface CuratedRoutesListProps {
  onRoutePress: (route: CuratedRoute) => void;
}

export function CuratedRoutesList({ onRoutePress }: CuratedRoutesListProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const { data: routes, isLoading, isError } = useCuratedRoutes();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="font-body text-sm" style={{ color: colors.secondary }}>
          Cargando rutas...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <Text
          className="text-center font-body text-sm"
          style={{ color: colors.secondary }}
        >
          No se pudieron cargar las rutas. Intentá de nuevo más tarde.
        </Text>
      </View>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <Text
          className="text-center font-body text-sm"
          style={{ color: colors.secondary }}
        >
          No hay rutas curadas disponibles aún.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={routes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CuratedRouteCard route={item} onPress={onRoutePress} />
      )}
      contentContainerClassName="pt-2 pb-8"
      showsVerticalScrollIndicator={false}
    />
  );
}
