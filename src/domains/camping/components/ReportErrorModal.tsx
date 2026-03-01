import { X } from "lucide-react-native";
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

import { useReportError } from "../hooks";
import { ERROR_REPORT_TYPES, type ErrorReportType } from "../types";

interface ReportErrorModalProps {
  visible: boolean;
  onClose: () => void;
  campingId: string;
}

export function ReportErrorModal({
  visible,
  onClose,
  campingId,
}: ReportErrorModalProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  const [selectedType, setSelectedType] = useState<ErrorReportType | null>(
    null,
  );
  const [description, setDescription] = useState("");

  const mutation = useReportError();

  const handleSubmit = () => {
    if (!selectedType) return;
    mutation.mutate(
      {
        camping_id: campingId,
        type: selectedType,
        description: description.trim() || "",
      },
      {
        onSuccess: () => {
          setSelectedType(null);
          setDescription("");
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setSelectedType(null);
      setDescription("");
      mutation.reset();
      onClose();
    }
  };

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
          <Text
            className="font-heading text-xl uppercase tracking-wide"
            style={{ color: colors.primary }}
          >
            Reportar error
          </Text>
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
          {/* Type selection */}
          <Text
            className="mb-2 mt-4 font-label text-sm uppercase tracking-wider"
            style={{ color: colors.secondary }}
          >
            Tipo de error
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {ERROR_REPORT_TYPES.map(({ value, label }) => {
              const active = selectedType === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setSelectedType(value)}
                >
                  <GlassView
                    level={active ? "andes" : "btn"}
                    className="rounded-glass-xs px-3 py-1.5"
                  >
                    <Text
                      className="font-label text-sm"
                      style={{
                        color: active ? colors.brand : colors.secondary,
                      }}
                    >
                      {label}
                    </Text>
                  </GlassView>
                </Pressable>
              );
            })}
          </View>

          {/* Description */}
          <Text
            className="mb-2 mt-6 font-label text-sm uppercase tracking-wider"
            style={{ color: colors.secondary }}
          >
            Descripción (opcional)
          </Text>
          <GlassView level="btn" className="rounded-glass-sm">
            <TextInput
              className="min-h-[100px] p-3 font-body text-sm"
              style={{ color: colors.primary, textAlignVertical: "top" }}
              placeholder="Describí el error que encontraste..."
              placeholderTextColor={colors.secondary}
              value={description}
              onChangeText={setDescription}
              multiline
              editable={!mutation.isPending}
            />
          </GlassView>

          {/* Error message */}
          {mutation.isError && (
            <Text className="mt-3 font-body text-sm text-crepusculo-500">
              No se pudo enviar el reporte. Intentá de nuevo.
            </Text>
          )}
        </ScrollView>

        {/* Footer */}
        <View
          className="border-t border-[#e3eaef] px-4 py-3 dark:border-[#36424d]"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            className={`items-center rounded-glass-sm py-3 ${
              !selectedType || mutation.isPending
                ? "bg-andes-500/40 dark:bg-andes-400/40"
                : "bg-andes-500 dark:bg-andes-400"
            }`}
            onPress={handleSubmit}
            disabled={!selectedType || mutation.isPending}
          >
            <Text className="font-label text-sm uppercase tracking-wide text-white dark:text-[#0e3620]">
              {mutation.isPending ? "Enviando..." : "Enviar reporte"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
