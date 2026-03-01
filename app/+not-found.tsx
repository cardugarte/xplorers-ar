import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5 bg-white dark:bg-neutral-900">
        <Text className="text-xl font-bold text-neutral-900 dark:text-white">
          Esta pantalla no existe.
        </Text>
        <Link href="/" className="mt-4 py-4">
          <Text className="text-sm text-primary-600">
            Volver al inicio
          </Text>
        </Link>
      </View>
    </>
  );
}
