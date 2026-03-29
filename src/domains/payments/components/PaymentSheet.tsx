import {
  ActivityIndicator,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
} from "lucide-react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import type { PaymentSheetStatus } from "../types";
import { HODL_THRESHOLD_NIGHTS } from "../usePayment";

// ── Helpers ──

function formatSats(sats: number): string {
  return sats.toLocaleString("es-AR");
}

// ── Status display config ──

const STATUS_CONFIG: Record<
  PaymentSheetStatus,
  { label: string; sublabel?: string }
> = {
  idle: { label: "Pagar con Lightning" },
  resolving: { label: "Resolviendo dirección...", sublabel: "Obteniendo invoice del camping" },
  invoice_ready: { label: "Invoice listo", sublabel: "Enviando pago..." },
  paying: { label: "Procesando pago...", sublabel: "Esperando confirmación de la red" },
  success: { label: "Pago confirmado", sublabel: "Tu reserva fue pagada exitosamente" },
  error: { label: "Error en el pago", sublabel: "Tocá para reintentar" },
};

// ── Props ──

interface PaymentSheetProps {
  amountSats: number;
  nights: number;
  status: PaymentSheetStatus;
  errorMessage?: string | null;
  onPay: () => void;
  onRetry: () => void;
  onClose: () => void;
}

/**
 * Payment bottom sheet showing amount, Lightning pay button,
 * and loading/success/error states.
 *
 * Displays HODL invoice info for multi-day reservations (4+ nights).
 */
export function PaymentSheet({
  amountSats,
  nights,
  status,
  errorMessage,
  onPay,
  onRetry,
  onClose,
}: PaymentSheetProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const isLoading = status === "resolving" || status === "paying" || status === "invoice_ready";
  const isDone = status === "success";
  const isError = status === "error";
  const isHodl = nights >= HODL_THRESHOLD_NIGHTS;

  const config = STATUS_CONFIG[status];

  return (
    <GlassView level="ultra" blur className="rounded-t-3xl px-6 pb-8 pt-6">
      {/* Header */}
      <View className="mb-6 flex-row items-center justify-between">
        <Text
          className="font-heading text-xl"
          style={{ color: colors.primary }}
        >
          Pago de reserva
        </Text>
        <Pressable
          onPress={onClose}
          className="rounded-full px-3 py-1"
          disabled={isLoading}
        >
          <Text
            className="font-label text-sm"
            style={{ color: colors.secondary }}
          >
            Cerrar
          </Text>
        </Pressable>
      </View>

      {/* Amount */}
      <GlassView level="mid" className="mb-4 items-center rounded-2xl p-5">
        <Text
          className="font-label text-sm"
          style={{ color: colors.secondary }}
        >
          Total a pagar
        </Text>
        <View className="mt-1 flex-row items-baseline">
          <Zap size={20} color={colors.accent} />
          <Text
            className="ml-1 font-display text-3xl"
            style={{ color: colors.primary }}
          >
            {formatSats(amountSats)}
          </Text>
          <Text
            className="ml-1 font-body text-base"
            style={{ color: colors.secondary }}
          >
            sats
          </Text>
        </View>
        <Text
          className="mt-1 font-body text-sm"
          style={{ color: colors.secondary }}
        >
          {nights} {nights === 1 ? "noche" : "noches"}
        </Text>
      </GlassView>

      {/* HODL info banner */}
      {isHodl && status === "idle" && (
        <GlassView level="glaciar" className="mb-4 rounded-xl px-4 py-3">
          <Text
            className="font-label text-xs"
            style={{ color: colors.glaciar }}
          >
            Reserva protegida
          </Text>
          <Text
            className="mt-1 font-body text-xs"
            style={{ color: colors.secondary }}
          >
            Los fondos quedan retenidos hasta el check-in. Si no te
            presentas, se devuelven automáticamente.
          </Text>
        </GlassView>
      )}

      {/* Status indicator */}
      {isLoading && (
        <View className="mb-4 flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color={colors.brand} />
          <View>
            <Text
              className="font-label text-sm"
              style={{ color: colors.brand }}
            >
              {config.label}
            </Text>
            {config.sublabel && (
              <Text
                className="font-body text-xs"
                style={{ color: colors.secondary }}
              >
                {config.sublabel}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Success */}
      {isDone && (
        <View className="mb-4 items-center gap-2">
          <CheckCircle2 size={40} color={colors.brand} />
          <Text
            className="font-heading text-lg"
            style={{ color: colors.brand }}
          >
            {config.label}
          </Text>
          <Text
            className="font-body text-sm"
            style={{ color: colors.secondary }}
          >
            {config.sublabel}
          </Text>
        </View>
      )}

      {/* Error */}
      {isError && (
        <View className="mb-4 items-center gap-2">
          <AlertCircle size={32} color={colors.accent} />
          <Text
            className="font-label text-sm"
            style={{ color: colors.accent }}
          >
            {errorMessage ?? "Error desconocido"}
          </Text>
        </View>
      )}

      {/* Action button */}
      {!isDone && (
        <Pressable
          onPress={isError ? onRetry : onPay}
          disabled={isLoading}
          className="mt-2"
        >
          <GlassView
            level={isLoading ? "btn" : "andes"}
            className="flex-row items-center justify-center rounded-2xl px-6 py-4"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <>
                <Zap size={18} color={dark ? "#83c29a" : "#175533"} />
                <Text
                  className="ml-2 font-heading text-base"
                  style={{ color: colors.brand }}
                >
                  {isError ? "Reintentar pago" : "Pagar con Lightning"}
                </Text>
              </>
            )}
          </GlassView>
        </Pressable>
      )}

      {/* Done — close button */}
      {isDone && (
        <Pressable onPress={onClose} className="mt-2">
          <GlassView
            level="andes"
            className="items-center rounded-2xl px-6 py-4"
          >
            <Text
              className="font-heading text-base"
              style={{ color: colors.brand }}
            >
              Listo
            </Text>
          </GlassView>
        </Pressable>
      )}
    </GlassView>
  );
}
