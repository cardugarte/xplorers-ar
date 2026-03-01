import { View, Text } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";

export default function CampingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Camping" }} />
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
          Detalle de Camping
        </Text>
        <Text className="mt-2 text-sm text-neutral-500">ID: {id}</Text>
        <Text className="mt-1 text-sm text-neutral-500">
          Implementación completa — issue #7
        </Text>
      </View>
    </>
  );
}
