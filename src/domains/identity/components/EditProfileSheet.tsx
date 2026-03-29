/**
 * EditProfileSheet — bottom sheet for editing Nostr profile (kind:0).
 *
 * Fields: name, about, picture URL, lud16 (Lightning address), nip05.
 * Publishes via useUpdateProfile() → kind:0 event to the relay pool.
 *
 * Pre-populated with current profile values when `initialProfile` is provided.
 * Spanish UI throughout.
 */

import { Check, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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

import {
  NostrProfileSchema,
  useUpdateProfile,
  type NostrProfile,
} from "../useNostrProfile";

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  initialProfile?: NostrProfile;
}

interface FieldConfig {
  key: keyof NostrProfile;
  label: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "url";
  autoCapitalize?: "none" | "sentences" | "words";
  hint?: string;
}

const FIELDS: FieldConfig[] = [
  {
    key: "name",
    label: "Nombre",
    placeholder: "¿Cómo te llamás?",
    autoCapitalize: "words",
  },
  {
    key: "about",
    label: "Bio",
    placeholder: "Contá algo sobre vos…",
    multiline: true,
    autoCapitalize: "sentences",
  },
  {
    key: "picture",
    label: "Foto de perfil",
    placeholder: "https://...",
    keyboardType: "url",
    autoCapitalize: "none",
    hint: "URL pública de tu imagen (nostr.build, imgur, etc.)",
  },
  {
    key: "lud16",
    label: "Lightning Address",
    placeholder: "vos@walletofsatoshi.com",
    keyboardType: "email-address",
    autoCapitalize: "none",
    hint: "Tu Lightning Address para recibir zaps (formato usuario@dominio.com)",
  },
  {
    key: "nip05",
    label: "Verificación NIP-05",
    placeholder: "vos@xplorers.ar",
    keyboardType: "email-address",
    autoCapitalize: "none",
    hint: "Identidad verificable vía DNS (opcional)",
  },
];

export function EditProfileSheet({
  visible,
  onClose,
  initialProfile,
}: EditProfileSheetProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<NostrProfile>(
    initialProfile ?? {
      name: "",
      about: "",
      picture: "",
      lud16: "",
      nip05: "",
    },
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useUpdateProfile();

  const handleChange = (key: keyof NostrProfile, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError(null);
  };

  const handleSave = () => {
    const result = NostrProfileSchema.safeParse(form);
    if (!result.success) {
      setValidationError(result.error.errors[0]?.message ?? "Perfil inválido");
      return;
    }
    mutation.mutate(
      { profile: result.data },
      {
        onSuccess: () => {
          mutation.reset();
          onClose();
        },
        onError: (err) => {
          setValidationError(err.message);
        },
      },
    );
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      mutation.reset();
      setValidationError(null);
      onClose();
    }
  };

  const isValid = form.name?.trim() && form.name.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]"
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text
            className="font-heading text-xl uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            Editar perfil
          </Text>
          <Pressable onPress={handleClose} hitSlop={8} disabled={mutation.isPending}>
            <View className="rounded-full bg-[#e3eaef] p-1.5 dark:bg-[#36424d]">
              <X size={18} color={colors.secondary} />
            </View>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {FIELDS.map(
            ({
              key,
              label,
              placeholder,
              multiline,
              keyboardType = "default",
              autoCapitalize = "none",
              hint,
            }) => (
              <View key={key} className="mt-5">
                <Text
                  className="mb-1.5 font-label text-sm uppercase tracking-wider"
                  style={{ color: colors.secondary }}
                >
                  {label}
                </Text>
                <GlassView level="btn" className="rounded-glass-sm">
                  <TextInput
                    className={`px-3 py-2.5 font-body text-sm ${multiline ? "min-h-[80px]" : ""}`}
                    style={{
                      color: colors.primary,
                      textAlignVertical: multiline ? "top" : "center",
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={colors.secondary}
                    value={(form[key] as string) ?? ""}
                    onChangeText={(v) => handleChange(key, v)}
                    multiline={multiline}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={key === "about"}
                    editable={!mutation.isPending}
                  />
                </GlassView>
                {hint && (
                  <Text
                    className="mt-1 font-body text-xs"
                    style={{ color: colors.secondary }}
                  >
                    {hint}
                  </Text>
                )}
              </View>
            ),
          )}

          {/* Validation / mutation error */}
          {(validationError || mutation.isError) && (
            <GlassView
              level="crepusculo"
              className="mt-4 rounded-glass-sm px-3 py-2.5"
            >
              <Text className="font-body text-sm text-crepusculo-600 dark:text-crepusculo-300">
                {validationError ?? mutation.error?.message ?? "Error al guardar"}
              </Text>
            </GlassView>
          )}

          {/* Success indicator */}
          {mutation.isSuccess && (
            <View className="mt-4 flex-row items-center gap-2">
              <Check size={16} color={colors.brand} />
              <Text className="font-body text-sm" style={{ color: colors.brand }}>
                Perfil publicado a los relays
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer — save button */}
        <View
          className="border-t border-[#e3eaef] px-4 py-3 dark:border-[#36424d]"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            className={`items-center rounded-glass-sm py-3 ${
              !isValid || mutation.isPending
                ? "bg-andes-500/40 dark:bg-andes-400/40"
                : "bg-andes-500 dark:bg-andes-400"
            }`}
            onPress={handleSave}
            disabled={!isValid || mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="font-label text-sm uppercase tracking-wide text-white dark:text-[#0e3620]">
                Guardar perfil
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
