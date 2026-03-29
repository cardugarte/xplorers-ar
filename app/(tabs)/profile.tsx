import { useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { Pressable, ScrollView, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import { BadgeGrid } from "@/src/domains/social/badges/BadgeGrid";
import { useAuthStore } from "@/src/domains/identity/store";
import { useSignOut } from "@/src/domains/identity/hooks";
import { ProfileHeader } from "@/src/domains/identity/components/ProfileHeader";
import { ProfileStats } from "@/src/domains/identity/components/ProfileStats";
import { SettingsSection } from "@/src/domains/identity/components/SettingsSection";

// Stub stats until social hooks are wired in Fase 2
const STUB_STATS = { checkIns: 0, reviews: 0, badges: 0 };

function AnonymousCTA() {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-5 px-6">
      <View
        className="h-20 w-20 items-center justify-center rounded-full"
        style={{
          backgroundColor: dark
            ? "rgba(80,164,114,0.20)"
            : "rgba(45,134,83,0.12)",
        }}
      >
        <User size={36} color={colors.brand} />
      </View>

      <View className="items-center gap-2">
        <Text
          className="font-heading text-2xl uppercase tracking-wide"
          style={{ color: colors.primary }}
        >
          Tu perfil
        </Text>
        <Text
          className="text-center font-body text-sm"
          style={{ color: colors.secondary }}
        >
          Creá tu cuenta Nostr para guardar check-ins, reviews y ganar badges de explorador.
        </Text>
      </View>

      <Pressable onPress={() => router.push("/(auth)" as never)}>
        <GlassView level="andes" className="rounded-glass px-8 py-3.5">
          <Text
            className="font-heading text-base uppercase tracking-wide"
            style={{ color: colors.brand }}
          >
            Crear cuenta
          </Text>
        </GlassView>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)" as never)}>
        <Text
          className="font-body text-sm"
          style={{ color: colors.secondary }}
        >
          Ya tengo cuenta → Iniciar sesión
        </Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const dark = useColorScheme() === "dark";
  const { isAnonymous, identity } = useAuthStore((s) => ({
    isAnonymous: s.isAnonymous,
    identity: s.identity,
  }));
  const signOut = useSignOut();

  // Dark mode toggle is UI-only state for now; OS preference is the source of truth
  // until a Zustand UI store for theme override is wired in a future task
  function handleToggleDarkMode(_value: boolean) {
    // no-op stub — theme override store is future work
  }

  if (isAnonymous || !identity) {
    return (
      <View className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]">
        <AnonymousCTA />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen title */}
        <View className="px-4 pb-4 pt-14">
          <Text
            className="font-heading text-2xl uppercase tracking-wide"
            style={{ color: dark ? glassText.dark.primary : glassText.light.primary }}
          >
            Perfil
          </Text>
        </View>

        {/* 1. Header */}
        <ProfileHeader identity={identity} />

        {/* 2. Stats */}
        <View className="mt-4">
          <ProfileStats stats={STUB_STATS} />
        </View>

        {/* 3. Badge grid */}
        <View className="mt-6">
          <BadgeGrid earnedDTags={[]} />
        </View>

        {/* 4. Settings */}
        <View className="mt-6">
          <SettingsSection
            identity={identity}
            isDarkMode={dark}
            onToggleDarkMode={handleToggleDarkMode}
            onSignOut={signOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}
