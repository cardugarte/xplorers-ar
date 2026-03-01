import { View, Text } from "react-native";

export default function MapScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#fafbfc] dark:bg-[#1e2730]">
      <Text className="font-heading text-2xl uppercase tracking-wide text-andes-800 dark:text-andes-300">
        Mapa de Campings
      </Text>
      <Text className="mt-3 font-body text-sm text-[#4e6070] dark:text-[#ccd6df]">
        Mapbox se integra en issue #5
      </Text>
    </View>
  );
}
