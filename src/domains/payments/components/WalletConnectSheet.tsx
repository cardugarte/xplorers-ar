import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { Wallet, X, Zap, Unplug } from "lucide-react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import { useWalletConnection, useWalletBalance } from "../useNWC";

interface WalletConnectSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet for NWC wallet connection.
 * Paste a nostr+walletconnect:// URI, view balance, disconnect.
 */
export function WalletConnectSheet({
  visible,
  onClose,
}: WalletConnectSheetProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const { isConnected, isConnecting, connect, disconnect } =
    useWalletConnection();
  const { data: balanceSats, isPending: isLoadingBalance } =
    useWalletBalance();

  const [uri, setUri] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!uri.trim()) return;

    if (!uri.startsWith("nostr+walletconnect://")) {
      setError("La URI debe comenzar con nostr+walletconnect://");
      return;
    }

    setError(null);
    try {
      await connect(uri.trim());
      setUri("");
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo conectar la wallet",
      );
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const formatBalance = (sats: number): string => {
    if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)}M`;
    if (sats >= 1_000) return `${(sats / 1_000).toFixed(1)}k`;
    return String(sats);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}}>
          <GlassView level="ultra" blur className="rounded-t-3xl px-6 pb-10 pt-6">
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Wallet size={24} color={colors.brand} />
                <Text
                  className="font-heading text-xl"
                  style={{ color: colors.primary }}
                >
                  Wallet Lightning
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={20} color={colors.secondary} />
              </Pressable>
            </View>

            {isConnected ? (
              /* Connected state: show balance + disconnect */
              <View className="gap-5">
                {/* Balance card */}
                <GlassView level="andes" className="items-center rounded-2xl p-5">
                  <Text
                    className="mb-1 font-label text-sm"
                    style={{ color: colors.secondary }}
                  >
                    Balance
                  </Text>
                  {isLoadingBalance ? (
                    <ActivityIndicator color={colors.brand} />
                  ) : (
                    <View className="flex-row items-baseline gap-2">
                      <Zap size={20} color={colors.brand} fill={colors.brand} />
                      <Text
                        className="font-display text-3xl"
                        style={{ color: colors.brand }}
                      >
                        {balanceSats != null ? formatBalance(balanceSats) : "—"}
                      </Text>
                      <Text
                        className="font-label text-base"
                        style={{ color: colors.secondary }}
                      >
                        sats
                      </Text>
                    </View>
                  )}
                </GlassView>

                {/* Disconnect button */}
                <Pressable
                  onPress={handleDisconnect}
                  className="flex-row items-center justify-center gap-2 rounded-2xl py-3"
                  style={{
                    backgroundColor: dark
                      ? "rgba(255,80,80,0.15)"
                      : "rgba(255,80,80,0.1)",
                  }}
                >
                  <Unplug size={18} color="#ef4444" />
                  <Text
                    className="font-heading text-base"
                    style={{ color: "#ef4444" }}
                  >
                    Desconectar Wallet
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* Disconnected state: paste URI to connect */
              <View className="gap-4">
                <Text
                  className="font-body text-sm"
                  style={{ color: colors.secondary }}
                >
                  Pegá tu URI de Nostr Wallet Connect para conectar tu wallet
                  Lightning. La encontrás en tu wallet (Alby Hub, Zeus, Coinos,
                  etc).
                </Text>

                {/* URI input */}
                <TextInput
                  value={uri}
                  onChangeText={(text) => {
                    setUri(text);
                    setError(null);
                  }}
                  placeholder="nostr+walletconnect://..."
                  placeholderTextColor={colors.secondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  numberOfLines={3}
                  className="min-h-[80px] rounded-xl p-3 font-body text-sm"
                  style={{
                    color: colors.primary,
                    backgroundColor: dark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                    borderWidth: 1,
                    borderColor: error
                      ? "#ef4444"
                      : dark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.08)",
                    textAlignVertical: "top",
                  }}
                />

                {/* Error message */}
                {error && (
                  <Text className="font-body text-sm" style={{ color: "#ef4444" }}>
                    {error}
                  </Text>
                )}

                {/* Connect button */}
                <Pressable
                  onPress={handleConnect}
                  disabled={isConnecting || !uri.trim()}
                  className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
                  style={{
                    backgroundColor: isConnecting || !uri.trim()
                      ? dark
                        ? "rgba(45,134,83,0.3)"
                        : "rgba(45,134,83,0.2)"
                      : "#2d8653",
                    opacity: isConnecting || !uri.trim() ? 0.6 : 1,
                  }}
                >
                  {isConnecting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Zap size={18} color="#ffffff" />
                  )}
                  <Text className="font-heading text-base" style={{ color: "#ffffff" }}>
                    {isConnecting ? "Conectando..." : "Conectar Wallet"}
                  </Text>
                </Pressable>
              </View>
            )}
          </GlassView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
