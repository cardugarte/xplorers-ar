/**
 * ImportIdentitySheet — bottom sheet for importing an existing Nostr identity.
 *
 * Two methods:
 *   1. NIP-46 bunker:// — remote signer (nsec.app on iOS, Amber on Android).
 *      Connects via `useNIP46Import().connectBunker()`. Blocked by #17 but
 *      the UI is fully wired and shows a clear message if NDK isn't ready.
 *
 *   2. nsec paste — stores the raw key in SecureStore, local signing.
 *      NEVER transmits the nsec; shows a prominent security warning.
 *
 * Spanish UI throughout.
 */

import {
  AlertTriangle,
  CheckCircle,
  Key,
  Link,
  Loader,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import {
  useNIP46Import,
  type ImportMethod,
  type NIP46Status,
} from "../useNIP46";

interface ImportIdentitySheetProps {
  visible: boolean;
  onClose: () => void;
  onImported?: (pubkey: string | null) => void;
}

export function ImportIdentitySheet({
  visible,
  onClose,
  onImported,
}: ImportIdentitySheetProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  const [method, setMethod] = useState<ImportMethod>("bunker");
  const [input, setInput] = useState("");
  const [nsecConfirmed, setNsecConfirmed] = useState(false);

  const { state, connectBunker, importNsec, cancel, reset } = useNIP46Import();

  const isLoading =
    state.status === "connecting" || state.status === "waiting_approval";

  const handleImport = async () => {
    if (!input.trim()) return;

    if (method === "bunker") {
      await connectBunker(input.trim());
    } else {
      if (!nsecConfirmed) return;
      await importNsec(input.trim());
    }
  };

  // Notify parent once connected
  if (state.status === "connected") {
    onImported?.(state.pubkey);
  }

  const handleClose = () => {
    if (isLoading) {
      cancel();
    } else {
      reset();
      setInput("");
      setNsecConfirmed(false);
      onClose();
    }
  };

  const canSubmit =
    !isLoading &&
    input.trim().length > 0 &&
    (method === "bunker" || nsecConfirmed);

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
            Importar identidad
          </Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <View className="rounded-full bg-[#e3eaef] p-1.5 dark:bg-[#36424d]">
              <X size={18} color={colors.secondary} />
            </View>
          </Pressable>
        </View>

        <View className="flex-1 px-4">
          {/* Method selector */}
          <Text
            className="mb-2 mt-4 font-label text-sm uppercase tracking-wider"
            style={{ color: colors.secondary }}
          >
            Método
          </Text>
          <View className="flex-row gap-2">
            <MethodTab
              active={method === "bunker"}
              label="NIP-46 Bunker"
              icon={<Link size={14} color={method === "bunker" ? colors.brand : colors.secondary} />}
              onPress={() => {
                setMethod("bunker");
                setInput("");
                reset();
              }}
              colors={colors}
            />
            <MethodTab
              active={method === "nsec"}
              label="Clave nsec"
              icon={<Key size={14} color={method === "nsec" ? colors.brand : colors.secondary} />}
              onPress={() => {
                setMethod("nsec");
                setInput("");
                reset();
              }}
              colors={colors}
            />
          </View>

          {/* Method description */}
          <GlassView level="soft" className="mt-4 rounded-glass-sm px-3 py-2.5">
            {method === "bunker" ? (
              <Text className="font-body text-xs" style={{ color: colors.secondary }}>
                Conectá tu app de firma Nostr sin exponer tu clave privada.
                Usá <Text style={{ color: colors.brand }}>nsec.app</Text> en iOS
                o <Text style={{ color: colors.brand }}>Amber</Text> en Android.
                Requiere NDK Mobile (tarea #17).
              </Text>
            ) : (
              <Text className="font-body text-xs" style={{ color: colors.secondary }}>
                Importá tu clave privada directamente. Se guarda en el almacenamiento
                seguro del dispositivo. <Text style={{ color: colors.primary }} className="font-label">
                  Nunca la compartás con nadie.
                </Text>
              </Text>
            )}
          </GlassView>

          {/* Input */}
          <Text
            className="mb-1.5 mt-5 font-label text-sm uppercase tracking-wider"
            style={{ color: colors.secondary }}
          >
            {method === "bunker" ? "URI del bunker" : "Clave privada (nsec)"}
          </Text>
          <GlassView level="btn" className="rounded-glass-sm">
            <TextInput
              className="px-3 py-2.5 font-body text-sm"
              style={{ color: colors.primary }}
              placeholder={
                method === "bunker"
                  ? "bunker://pubkey?relay=wss://...&secret=..."
                  : "nsec1..."
              }
              placeholderTextColor={colors.secondary}
              value={input}
              onChangeText={(v) => {
                setInput(v);
                reset();
              }}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={method === "nsec"}
              editable={!isLoading}
              multiline={method === "bunker"}
              numberOfLines={method === "bunker" ? 2 : 1}
            />
          </GlassView>

          {/* nsec security warning + confirmation */}
          {method === "nsec" && input.trim().length > 0 && (
            <GlassView
              level="crepusculo"
              className="mt-4 rounded-glass-sm px-3 py-3"
            >
              <View className="flex-row items-start gap-2">
                <AlertTriangle size={16} color="#f56d09" className="mt-0.5" />
                <View className="flex-1">
                  <Text
                    className="font-label text-sm"
                    style={{ color: dark ? "#ffb05a" : "#b03807" }}
                  >
                    Advertencia de seguridad
                  </Text>
                  <Text
                    className="mt-1 font-body text-xs"
                    style={{ color: dark ? "#ffb05a" : "#b03807" }}
                  >
                    Tu clave privada da acceso total a tu identidad Nostr. Si la
                    perdés o alguien la ve, perdés el control de tu cuenta para siempre.
                    Xplorers la guarda encriptada en el dispositivo y nunca la transmite.
                  </Text>
                  <Pressable
                    className="mt-3 flex-row items-center gap-2"
                    onPress={() => setNsecConfirmed((v) => !v)}
                  >
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-md border-2 ${
                        nsecConfirmed
                          ? "border-crepusculo-500 bg-crepusculo-500"
                          : "border-crepusculo-400 bg-transparent"
                      }`}
                    >
                      {nsecConfirmed && <Text className="text-white text-xs">✓</Text>}
                    </View>
                    <Text
                      className="font-body text-xs"
                      style={{ color: dark ? "#ffb05a" : "#b03807" }}
                    >
                      Entiendo el riesgo y quiero continuar
                    </Text>
                  </Pressable>
                </View>
              </View>
            </GlassView>
          )}

          {/* Waiting for approval indicator */}
          {state.status === "waiting_approval" && (
            <GlassView
              level="glaciar"
              className="mt-4 flex-row items-center gap-3 rounded-glass-sm px-3 py-3"
            >
              <ActivityIndicator size="small" color={colors.glaciar} />
              <View className="flex-1">
                <Text className="font-label text-sm" style={{ color: colors.glaciar }}>
                  Esperando aprobación
                </Text>
                <Text className="font-body text-xs" style={{ color: colors.secondary }}>
                  Abrí tu app de firma y aprobá la conexión con Xplorers.
                </Text>
              </View>
            </GlassView>
          )}

          {/* Connected success */}
          {state.status === "connected" && (
            <GlassView
              level="andes"
              className="mt-4 flex-row items-center gap-2 rounded-glass-sm px-3 py-2.5"
            >
              <CheckCircle size={16} color={colors.brand} />
              <Text className="font-body text-sm" style={{ color: colors.brand }}>
                Identidad importada correctamente
              </Text>
            </GlassView>
          )}

          {/* Error */}
          {state.status === "error" && state.error && (
            <GlassView
              level="crepusculo"
              className="mt-4 rounded-glass-sm px-3 py-2.5"
            >
              <Text className="font-body text-sm text-crepusculo-600 dark:text-crepusculo-300">
                {state.error}
              </Text>
            </GlassView>
          )}
        </View>

        {/* Footer */}
        <View
          className="border-t border-[#e3eaef] px-4 py-3 dark:border-[#36424d]"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {isLoading ? (
            <Pressable
              className="items-center rounded-glass-sm bg-[#e3eaef] py-3 dark:bg-[#36424d]"
              onPress={cancel}
            >
              <Text
                className="font-label text-sm uppercase tracking-wide"
                style={{ color: colors.secondary }}
              >
                Cancelar
              </Text>
            </Pressable>
          ) : (
            <Pressable
              className={`items-center rounded-glass-sm py-3 ${
                canSubmit
                  ? "bg-andes-500 dark:bg-andes-400"
                  : "bg-andes-500/40 dark:bg-andes-400/40"
              }`}
              onPress={handleImport}
              disabled={!canSubmit}
            >
              <Text className="font-label text-sm uppercase tracking-wide text-white dark:text-[#0e3620]">
                {method === "bunker" ? "Conectar bunker" : "Importar clave"}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── MethodTab ────────────────────────────────────────────────────────────────

interface MethodTabProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  colors: typeof glassText.light | typeof glassText.dark;
}

function MethodTab({ active, label, icon, onPress, colors }: MethodTabProps) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <GlassView
        level={active ? "andes" : "btn"}
        className="flex-row items-center justify-center gap-1.5 rounded-glass-xs px-3 py-2"
      >
        {icon}
        <Text
          className="font-label text-sm"
          style={{ color: active ? colors.brand : colors.secondary }}
        >
          {label}
        </Text>
      </GlassView>
    </Pressable>
  );
}
