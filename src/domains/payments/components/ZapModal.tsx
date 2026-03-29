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
import { X, Zap, MessageCircle } from "lucide-react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import { useZap, ZAP_PRESETS } from "../useZaps";

interface ZapModalProps {
  visible: boolean;
  onClose: () => void;
  /** Recipient's Lightning address */
  lud16: string;
  /** Display name of the recipient */
  recipientName?: string;
  /** Nostr event ID (for cache invalidation) */
  eventId?: string;
}

/**
 * Modal with amount presets (21, 210, 2100, 21000 sats) and optional comment.
 * Handles the full zap flow: select amount -> (optional comment) -> pay.
 */
export function ZapModal({
  visible,
  onClose,
  lud16,
  recipientName,
  eventId,
}: ZapModalProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const [selectedSats, setSelectedSats] = useState<number>(ZAP_PRESETS[1].sats);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [comment, setComment] = useState("");

  const { mutate: zap, isPending, error, reset } = useZap();

  const effectiveAmount = isCustom
    ? parseInt(customAmount, 10) || 0
    : selectedSats;

  const handleSelectPreset = (sats: number) => {
    setIsCustom(false);
    setSelectedSats(sats);
    reset();
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
    setCustomAmount("");
    reset();
  };

  const handleZap = () => {
    if (effectiveAmount <= 0) return;

    zap(
      {
        lud16,
        amountSats: effectiveAmount,
        comment: comment.trim() || undefined,
        eventId,
      },
      {
        onSuccess: () => {
          // Reset state and close
          setComment("");
          setIsCustom(false);
          setSelectedSats(ZAP_PRESETS[1].sats);
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    if (isPending) return; // Don't close while paying
    reset();
    setComment("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onPress={handleClose}
      >
        <Pressable onPress={() => {}}>
          <GlassView level="ultra" blur className="rounded-t-3xl px-6 pb-10 pt-6">
            {/* Header */}
            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Zap size={22} color="#f59e0b" fill="#f59e0b" />
                <Text
                  className="font-heading text-xl"
                  style={{ color: colors.primary }}
                >
                  Enviar Zap
                </Text>
              </View>
              <Pressable onPress={handleClose} hitSlop={12}>
                <X size={20} color={colors.secondary} />
              </Pressable>
            </View>

            {/* Recipient */}
            {recipientName && (
              <Text
                className="mb-4 font-body text-sm"
                style={{ color: colors.secondary }}
              >
                Para{" "}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  {recipientName}
                </Text>
              </Text>
            )}

            {/* Amount presets */}
            <View className="mb-4 flex-row gap-2">
              {ZAP_PRESETS.map((preset) => {
                const isSelected = !isCustom && selectedSats === preset.sats;
                return (
                  <Pressable
                    key={preset.sats}
                    onPress={() => handleSelectPreset(preset.sats)}
                    className="flex-1 items-center rounded-xl py-3"
                    style={{
                      backgroundColor: isSelected
                        ? "#f59e0b"
                        : dark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.04)",
                      borderWidth: 1,
                      borderColor: isSelected
                        ? "#f59e0b"
                        : dark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <Text
                      className="font-heading text-base"
                      style={{
                        color: isSelected ? "#ffffff" : colors.primary,
                      }}
                    >
                      {preset.label}
                    </Text>
                    <Text
                      className="font-label text-xs"
                      style={{
                        color: isSelected ? "rgba(255,255,255,0.8)" : colors.secondary,
                      }}
                    >
                      sats
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom amount toggle */}
            <Pressable
              onPress={handleSelectCustom}
              className="mb-4 items-center rounded-xl py-2.5"
              style={{
                backgroundColor: isCustom
                  ? "#f59e0b"
                  : dark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                borderWidth: 1,
                borderColor: isCustom
                  ? "#f59e0b"
                  : dark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
              }}
            >
              <Text
                className="font-heading text-sm"
                style={{ color: isCustom ? "#ffffff" : colors.secondary }}
              >
                Monto personalizado
              </Text>
            </Pressable>

            {/* Custom amount input */}
            {isCustom && (
              <TextInput
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="Cantidad en sats"
                placeholderTextColor={colors.secondary}
                keyboardType="number-pad"
                className="mb-4 rounded-xl p-3 text-center font-heading text-2xl"
                style={{
                  color: colors.primary,
                  backgroundColor: dark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  borderWidth: 1,
                  borderColor: dark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
                }}
              />
            )}

            {/* Comment input */}
            <View className="mb-5">
              <View className="mb-1.5 flex-row items-center gap-1.5">
                <MessageCircle size={14} color={colors.secondary} />
                <Text
                  className="font-label text-xs"
                  style={{ color: colors.secondary }}
                >
                  Comentario (opcional)
                </Text>
              </View>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Gran camping!"
                placeholderTextColor={colors.secondary}
                maxLength={280}
                className="rounded-xl p-3 font-body text-sm"
                style={{
                  color: colors.primary,
                  backgroundColor: dark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  borderWidth: 1,
                  borderColor: dark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.08)",
                }}
              />
            </View>

            {/* Error */}
            {error && (
              <Text
                className="mb-3 text-center font-body text-sm"
                style={{ color: "#ef4444" }}
              >
                {error.message}
              </Text>
            )}

            {/* Zap button */}
            <Pressable
              onPress={handleZap}
              disabled={isPending || effectiveAmount <= 0}
              className="flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
              style={{
                backgroundColor:
                  isPending || effectiveAmount <= 0
                    ? dark
                      ? "rgba(245,158,11,0.3)"
                      : "rgba(245,158,11,0.2)"
                    : "#f59e0b",
                opacity: isPending || effectiveAmount <= 0 ? 0.6 : 1,
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Zap size={20} color="#ffffff" fill="#ffffff" />
              )}
              <Text
                className="font-heading text-base"
                style={{ color: "#ffffff" }}
              >
                {isPending
                  ? "Pagando..."
                  : `Zap ${effectiveAmount > 0 ? effectiveAmount.toLocaleString() : ""} sats`}
              </Text>
            </Pressable>
          </GlassView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
