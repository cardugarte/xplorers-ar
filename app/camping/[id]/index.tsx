import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { AlertTriangle, ChevronLeft, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import { useCamping } from "@/src/domains/camping/hooks";
import { CAMPING_TYPE_LABELS } from "@/src/domains/camping/types";
import { CampingDetailHero } from "@/src/domains/camping/components/CampingDetailHero";
import { CampingAmenitiesGrid } from "@/src/domains/camping/components/CampingAmenitiesGrid";
import { CampingPricesSection } from "@/src/domains/camping/components/CampingPricesSection";
import { CampingContactSection } from "@/src/domains/camping/components/CampingContactSection";
import { ReportErrorModal } from "@/src/domains/camping/components/ReportErrorModal";

export default function CampingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const { data: camping, isPending, error } = useCamping(id!);
  const [isReportOpen, setIsReportOpen] = useState(false);

  if (isPending) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-[#fafbfc] dark:bg-[#1e2730]">
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </>
    );
  }

  if (error || !camping) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          className="flex-1 items-center justify-center bg-[#fafbfc] px-6 dark:bg-[#1e2730]"
          style={{ paddingTop: insets.top }}
        >
          <Text
            className="font-body text-base text-center"
            style={{ color: colors.secondary }}
          >
            No se pudo cargar el camping.
          </Text>
          <Pressable className="mt-4" onPress={() => router.back()}>
            <Text
              className="font-label text-sm uppercase"
              style={{ color: colors.brand }}
            >
              Volver
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]">
        {/* Header */}
        <View
          className="flex-row items-center gap-2 px-4 pb-2"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <View className="rounded-full bg-[#e3eaef] p-1.5 dark:bg-[#36424d]">
              <ChevronLeft size={20} color={colors.primary} />
            </View>
          </Pressable>
          <Text
            className="flex-1 font-heading text-lg"
            style={{ color: colors.primary }}
            numberOfLines={1}
          >
            {camping.name}
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-8"
        >
          <CampingDetailHero photos={camping.photos ?? []} />

          {/* Type + Verified badges */}
          <View className="mt-4 flex-row items-center gap-2 px-4">
            {camping.type && (
              <GlassView level="andes" className="rounded-glass-xs px-3 py-1">
                <Text
                  className="font-label text-xs"
                  style={{ color: colors.brand }}
                >
                  {CAMPING_TYPE_LABELS[camping.type]}
                </Text>
              </GlassView>
            )}
            {camping.verified && (
              <GlassView
                level="glaciar"
                className="flex-row items-center gap-1 rounded-glass-xs px-3 py-1"
              >
                <ShieldCheck size={12} color={colors.glaciar} />
                <Text
                  className="font-label text-xs"
                  style={{ color: colors.glaciar }}
                >
                  Verificado
                </Text>
              </GlassView>
            )}
          </View>

          {/* Province */}
          <Text
            className="mt-3 px-4 font-body text-sm"
            style={{ color: colors.secondary }}
          >
            {camping.province}
          </Text>

          {/* Amenities */}
          <View className="mt-6">
            <CampingAmenitiesGrid
              amenities={camping.amenities ?? {}}
            />
          </View>

          {/* Prices */}
          <View className="mt-6">
            <CampingPricesSection prices={camping.prices ?? null} />
          </View>

          {/* Contact */}
          <View className="mt-6">
            <CampingContactSection
              contact={camping.contact ?? null}
              campingName={camping.name}
            />
          </View>
        </ScrollView>

        {/* Footer — Report button */}
        <View
          className="border-t border-[#e3eaef] px-4 py-3 dark:border-[#36424d]"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            className="flex-row items-center justify-center gap-2 rounded-glass-sm bg-[#e3eaef] py-3 dark:bg-[#36424d]"
            onPress={() => setIsReportOpen(true)}
          >
            <AlertTriangle size={16} color={colors.accent} />
            <Text
              className="font-label text-sm uppercase tracking-wide"
              style={{ color: colors.secondary }}
            >
              Reportar error
            </Text>
          </Pressable>
        </View>

        <ReportErrorModal
          visible={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          campingId={id!}
        />
      </View>
    </>
  );
}
