import { View, Text } from "react-native";
import { Stack } from "expo-router";

export default function OnboardingScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Bienvenido", headerShown: false }} />
      <View className="flex-1 items-center justify-center bg-primary-900">
        <Text className="text-3xl font-bold text-white">Xplorers</Text>
        <Text className="mt-4 text-lg text-primary-200">
          Descubrí todos los campings de Argentina
        </Text>
      </View>
    </>
  );
}
