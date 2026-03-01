import { View, Text } from "react-native";
import { Stack } from "expo-router";

export default function OnboardingScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Bienvenido", headerShown: false }} />
      <View className="flex-1 items-center justify-center bg-andes-800">
        <Text className="font-heading-extra text-5xl uppercase tracking-wider text-[#daf0ff]">
          Xplorers
        </Text>
        <Text className="mt-4 font-body-light text-lg text-andes-300">
          Descubrí todos los campings de Argentina
        </Text>
      </View>
    </>
  );
}
