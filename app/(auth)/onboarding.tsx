import { router, Stack } from "expo-router";
import { Tent } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center bg-andes-800 px-8">
        {/* Logo / marca */}
        <View className="mb-2 items-center">
          <Tent size={52} color="#daf0ff" strokeWidth={1.5} />
        </View>
        <Text className="font-heading-extra text-5xl uppercase tracking-wider text-[#daf0ff]">
          Xplorers
        </Text>
        <Text className="mt-3 font-body-light text-center text-lg text-andes-300">
          Descubrí todos los campings de Argentina
        </Text>

        {/* Acciones */}
        <View className="mt-16 w-full gap-3">
          <TouchableOpacity
            className="w-full items-center rounded-2xl bg-glaciar-500 py-4"
            onPress={() => router.push("/(auth)/sign-up" as any)}
            activeOpacity={0.85}
          >
            <Text className="font-label-semibold text-base text-white">
              Crear cuenta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full items-center rounded-2xl border border-andes-600 py-4"
            onPress={() => router.replace("/(tabs)" as any)}
            activeOpacity={0.75}
          >
            <Text className="font-body text-base text-andes-300">
              Continuar sin cuenta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-1 w-full items-center py-2"
            onPress={() => router.push("/(auth)/sign-in" as any)}
            activeOpacity={0.75}
          >
            <Text className="font-body text-sm text-andes-400">
              Ya tengo cuenta{" "}
              <Text className="text-glaciar-400">Iniciar sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
