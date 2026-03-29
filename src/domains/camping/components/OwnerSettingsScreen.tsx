import { Zap } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import { useSetLightningAddress } from "../useOwnerSettings";

interface OwnerSettingsScreenProps {
  campingId: string;
  currentLightningAddress?: string | null;
  onSaved?: () => void;
}

export function OwnerSettingsScreen({
  campingId,
  currentLightningAddress,
  onSaved,
}: OwnerSettingsScreenProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  const [lud16, setLud16] = useState(currentLightningAddress ?? "");

  const mutation = useSetLightningAddress();

  const isValidFormat =
    lud16.trim().includes("@") && lud16.trim().split("@").length === 2;

  const handleSave = () => {
    if (!isValidFormat || mutation.isPending) return;
    mutation.mutate(
      { campingId, lud16: lud16.trim() },
      {
        onSuccess: () => {
          onSaved?.();
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]"
        contentContainerClassName="px-4 pb-8"
        style={{ paddingTop: insets.top + 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6 flex-row items-center gap-3">
          <View className="rounded-full bg-andes-500/15 p-2.5">
            <Zap size={22} color={colors.brand} />
          </View>
          <View className="flex-1">
            <Text
              className="font-heading text-xl uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Lightning Address
            </Text>
            <Text
              className="mt-0.5 font-body text-sm"
              style={{ color: colors.secondary }}
            >
              Recibí pagos y zaps directamente en tu wallet
            </Text>
          </View>
        </View>

        {/* Input */}
        <Text
          className="mb-2 font-label text-xs uppercase tracking-wider"
          style={{ color: colors.secondary }}
        >
          Tu Lightning Address
        </Text>
        <GlassView level="btn" className="rounded-glass-sm">
          <TextInput
            className="px-3 py-3.5 font-body text-base"
            style={{ color: colors.primary }}
            placeholder="vos@walletofsatoshi.com"
            placeholderTextColor={colors.secondary}
            value={lud16}
            onChangeText={(t) => {
              setLud16(t);
              if (mutation.isError || mutation.isSuccess) mutation.reset();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!mutation.isPending}
          />
        </GlassView>

        <Text
          className="mt-2 font-body text-xs"
          style={{ color: colors.secondary }}
        >
          Formato: usuario@dominio.com — Ej: vos@getalby.com,
          vos@walletofsatoshi.com
        </Text>

        {/* Nostr zaps warning after success */}
        {mutation.isSuccess && !mutation.data.allowsNostr && (
          <GlassView
            level="crepusculo"
            className="mt-4 rounded-glass-sm px-3 py-3"
          >
            <Text
              className="font-body text-sm"
              style={{ color: colors.accent }}
            >
              Aviso: esta wallet no soporta zaps Nostr (allowsNostr: false). Los
              pagos directos funcionan, pero los zaps NIP-57 no generarán
              recibo.
            </Text>
          </GlassView>
        )}

        {/* Success */}
        {mutation.isSuccess && (
          <GlassView level="andes" className="mt-4 rounded-glass-sm px-3 py-3">
            <Text
              className="font-body text-sm"
              style={{ color: colors.brand }}
            >
              ¡Lightning Address guardada correctamente!
              {mutation.data.allowsNostr
                ? " Soporta zaps Nostr."
                : ""}
            </Text>
          </GlassView>
        )}

        {/* Error */}
        {mutation.isError && (
          <Text className="mt-3 font-body text-sm text-crepusculo-500">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "No se pudo guardar. Intentá de nuevo."}
          </Text>
        )}

        {/* Save button */}
        <Pressable
          className={`mt-6 items-center rounded-glass-sm py-3.5 ${
            !isValidFormat || mutation.isPending
              ? "bg-andes-500/40 dark:bg-andes-400/40"
              : "bg-andes-500 dark:bg-andes-400"
          }`}
          onPress={handleSave}
          disabled={!isValidFormat || mutation.isPending}
          style={{ marginBottom: insets.bottom + 8 }}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="font-label text-sm uppercase tracking-wide text-white dark:text-[#0e3620]">
              Guardar dirección
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
