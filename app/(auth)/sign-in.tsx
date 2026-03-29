import { router, Stack } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { useSignIn } from "@/src/domains/identity/hooks";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const signIn = useSignIn();

  async function handleSignIn() {
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Completá el email y la contraseña.");
      return;
    }

    try {
      await signIn.mutateAsync({ email: email.trim(), password });
      router.replace("/(tabs)" as any);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión.";
      setFormError(msg);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-andes-800 px-8 pt-16">
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-8 self-start"
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#daf0ff" />
        </TouchableOpacity>

        {/* Header */}
        <Text className="font-heading text-3xl uppercase tracking-wider text-[#daf0ff]">
          Iniciar sesión
        </Text>
        <Text className="mt-2 font-body-light text-base text-andes-400">
          Ingresá con tu cuenta de Xplorers
        </Text>

        {/* Form */}
        <View className="mt-10 gap-4">
          <View>
            <Text className="mb-1 font-label text-sm text-andes-300">Email</Text>
            <TextInput
              className="rounded-xl border border-andes-600 bg-andes-700 px-4 py-3 font-body text-base text-[#daf0ff]"
              placeholder="tu@email.com"
              placeholderTextColor="#6b8a9a"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="mb-1 font-label text-sm text-andes-300">Contraseña</Text>
            <TextInput
              className="rounded-xl border border-andes-600 bg-andes-700 px-4 py-3 font-body text-base text-[#daf0ff]"
              placeholder="••••••••"
              placeholderTextColor="#6b8a9a"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {formError ? (
            <Text className="font-body text-sm text-crepusculo-400">{formError}</Text>
          ) : null}

          <TouchableOpacity
            className="mt-2 w-full items-center rounded-2xl bg-glaciar-500 py-4"
            onPress={handleSignIn}
            disabled={signIn.isPending}
            activeOpacity={0.85}
          >
            <Text className="font-label-semibold text-base text-white">
              {signIn.isPending ? "Ingresando..." : "Ingresar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.replace("/(auth)/sign-up" as any)}
          activeOpacity={0.75}
        >
          <Text className="font-body text-sm text-andes-400">
            ¿No tenés cuenta?{" "}
            <Text className="text-glaciar-400">Registrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
