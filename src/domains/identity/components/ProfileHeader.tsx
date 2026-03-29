import { User } from "lucide-react-native";
import { Pressable, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import type { NostrIdentity } from "@/src/domains/identity/types";

function truncateNpub(npub: string): string {
  if (npub.length <= 20) return npub;
  return `${npub.slice(0, 10)}…${npub.slice(-8)}`;
}

interface ProfileHeaderProps {
  identity: NostrIdentity;
  onEditPress?: () => void;
}

export function ProfileHeader({ identity, onEditPress }: ProfileHeaderProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  return (
    <GlassView level="ultra" className="mx-4 rounded-glass p-5">
      <View className="flex-row items-center gap-4">
        {/* Avatar placeholder */}
        <View
          className="h-16 w-16 items-center justify-center rounded-full"
          style={{
            backgroundColor: dark
              ? "rgba(80,164,114,0.20)"
              : "rgba(45,134,83,0.12)",
          }}
        >
          {identity.picture ? (
            // Image support for Fase 2 when Nostr profile pictures are loaded
            <User size={28} color={colors.brand} />
          ) : (
            <User size={28} color={colors.brand} />
          )}
        </View>

        {/* Name + npub */}
        <View className="flex-1">
          <Text
            className="font-heading text-lg"
            style={{ color: colors.primary }}
            numberOfLines={1}
          >
            {identity.displayName ?? "Explorador"}
          </Text>
          <Text
            className="font-label text-xs"
            style={{ color: colors.secondary }}
            numberOfLines={1}
            selectable
          >
            {truncateNpub(identity.npub)}
          </Text>
          {identity.nip05 && (
            <Text
              className="font-body text-xs"
              style={{ color: colors.glaciar }}
              numberOfLines={1}
            >
              {identity.nip05}
            </Text>
          )}
        </View>

        {/* Edit button */}
        {onEditPress && (
          <Pressable onPress={onEditPress}>
            <GlassView level="btn" className="rounded-glass-xs px-3 py-1.5">
              <Text className="font-label text-xs" style={{ color: colors.secondary }}>
                Editar
              </Text>
            </GlassView>
          </Pressable>
        )}
      </View>

      {/* About */}
      {identity.about ? (
        <Text
          className="mt-3 font-body text-sm"
          style={{ color: colors.secondary }}
          numberOfLines={3}
        >
          {identity.about}
        </Text>
      ) : null}
    </GlassView>
  );
}
