import { ShieldCheck, X } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
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

import { useClaimStatus, useSubmitClaim } from "../useOwnerClaiming";

interface ClaimOwnershipModalProps {
  visible: boolean;
  onClose: () => void;
  campingId: string;
  campingName: string;
}

export function ClaimOwnershipModal({
  visible,
  onClose,
  campingId,
  campingName,
}: ClaimOwnershipModalProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  const [evidence, setEvidence] = useState("");

  const mutation = useSubmitClaim();
  const { data: existingClaim } = useClaimStatus(campingId);

  const handleSubmit = () => {
    if (!evidence.trim()) return;
    mutation.mutate(
      { campingId, evidence: evidence.trim() },
      {
        onSuccess: () => {
          setEvidence("");
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setEvidence("");
      mutation.reset();
      onClose();
    }
  };

  const alreadyClaimed = !!existingClaim;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View
        className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]"
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={20} color={colors.brand} />
            <Text
              className="font-heading text-xl uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Soy el dueño
            </Text>
          </View>
          <Pressable onPress={handleClose} hitSlop={8}>
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
          {alreadyClaimed ? (
            <AlreadyClaimedBanner claim={existingClaim} colors={colors} />
          ) : (
            <>
              {/* Descripción */}
              <Text
                className="mt-4 font-body text-sm leading-relaxed"
                style={{ color: colors.secondary }}
              >
                Reclamá la propiedad de{" "}
                <Text style={{ color: colors.primary }} className="font-label">
                  {campingName}
                </Text>
                . Un administrador revisará tu solicitud manualmente y te
                contactará para confirmar.
              </Text>

              {/* Evidencia */}
              <Text
                className="mb-2 mt-6 font-label text-sm uppercase tracking-wider"
                style={{ color: colors.secondary }}
              >
                Evidencia de propiedad
              </Text>
              <GlassView level="btn" className="rounded-glass-sm">
                <TextInput
                  className="min-h-[120px] p-3 font-body text-sm"
                  style={{ color: colors.primary, textAlignVertical: "top" }}
                  placeholder="Describí cómo podés demostrar que sos el dueño: email de contacto del camping, teléfono, documentación, etc."
                  placeholderTextColor={colors.secondary}
                  value={evidence}
                  onChangeText={setEvidence}
                  multiline
                  editable={!mutation.isPending}
                />
              </GlassView>

              {/* Error message */}
              {mutation.isError && (
                <Text className="mt-3 font-body text-sm text-crepusculo-500">
                  {(mutation.error as Error)?.message ??
                    "No se pudo enviar el reclamo. Intentá de nuevo."}
                </Text>
              )}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        {!alreadyClaimed && (
          <View
            className="border-t border-[#e3eaef] px-4 py-3 dark:border-[#36424d]"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <Pressable
              className={`items-center rounded-glass-sm py-3 ${
                !evidence.trim() || mutation.isPending
                  ? "bg-andes-500/40 dark:bg-andes-400/40"
                  : "bg-andes-500 dark:bg-andes-400"
              }`}
              onPress={handleSubmit}
              disabled={!evidence.trim() || mutation.isPending}
            >
              <Text className="font-label text-sm uppercase tracking-wide text-white dark:text-[#0e3620]">
                {mutation.isPending ? "Enviando..." : "Enviar reclamo"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

const STATUS_LABELS = {
  pending: "Pendiente de revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
} as const;

const STATUS_COLORS = {
  pending: "text-crepusculo-600 dark:text-crepusculo-400",
  approved: "text-andes-600 dark:text-andes-400",
  rejected: "text-crepusculo-500",
} as const;

type GlassColors = (typeof glassText)[keyof typeof glassText];

function AlreadyClaimedBanner({
  claim,
  colors,
}: {
  claim: { status: "pending" | "approved" | "rejected"; created_at: string };
  colors: GlassColors;
}) {
  const date = new Date(claim.created_at).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <GlassView level="soft" className="mt-6 rounded-glass p-4">
      <Text
        className="font-label text-sm uppercase tracking-wider"
        style={{ color: colors.secondary }}
      >
        Estado del reclamo
      </Text>
      <Text className={`mt-1 font-heading text-lg ${STATUS_COLORS[claim.status]}`}>
        {STATUS_LABELS[claim.status]}
      </Text>
      <Text className="mt-1 font-body text-sm" style={{ color: colors.secondary }}>
        Enviado el {date}
      </Text>
      {claim.status === "pending" && (
        <Text
          className="mt-3 font-body text-sm leading-relaxed"
          style={{ color: colors.secondary }}
        >
          Tu reclamo está siendo revisado. Te contactaremos a la brevedad.
        </Text>
      )}
    </GlassView>
  );
}
