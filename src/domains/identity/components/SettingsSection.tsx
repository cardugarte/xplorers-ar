import { LogOut, Moon, Settings, Zap } from "lucide-react-native";
import { Alert, Pressable, Switch, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import type { NostrIdentity } from "@/src/domains/identity/types";

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingRow({ icon, label, right, onPress, destructive = false }: SettingRowProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const labelColor = destructive
    ? dark
      ? "#ffb05a"
      : "#b03807"
    : colors.primary;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      {({ pressed }) => (
        <View
          className="flex-row items-center gap-3 px-4 py-3.5"
          style={{ opacity: pressed ? 0.65 : 1 }}
        >
          <View className="w-5 items-center">{icon}</View>
          <Text
            className="flex-1 font-body text-sm"
            style={{ color: labelColor }}
          >
            {label}
          </Text>
          {right ?? null}
        </View>
      )}
    </Pressable>
  );
}

interface SettingsSectionProps {
  identity: NostrIdentity;
  isDarkMode: boolean;
  onToggleDarkMode: (value: boolean) => void;
  onSignOut: () => void;
}

export function SettingsSection({
  identity,
  isDarkMode,
  onToggleDarkMode,
  onSignOut,
}: SettingsSectionProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  function handleSignOut() {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que querés cerrar sesión? Tus claves Nostr se eliminarán del dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar sesión", style: "destructive", onPress: onSignOut },
      ],
    );
  }

  return (
    <GlassView level="ultra" className="mx-4 rounded-glass">
      {/* Section header */}
      <View className="border-b border-[rgba(30,39,48,0.08)] px-4 pb-2 pt-3 dark:border-[rgba(255,255,255,0.07)]">
        <View className="flex-row items-center gap-2">
          <Settings size={14} color={colors.secondary} />
          <Text
            className="font-heading text-xs uppercase tracking-wide"
            style={{ color: colors.secondary }}
          >
            Configuración
          </Text>
        </View>
      </View>

      {/* Dark mode */}
      <SettingRow
        icon={<Moon size={16} color={colors.secondary} />}
        label="Modo oscuro"
        right={
          <Switch
            value={isDarkMode}
            onValueChange={onToggleDarkMode}
            trackColor={{
              false: dark ? "#36424d" : "#e3eaef",
              true: "#2d8653",
            }}
            thumbColor={isDarkMode ? "#daf0ff" : "#8293a3"}
          />
        }
      />

      {/* Divider */}
      <View className="mx-4 h-px bg-[rgba(30,39,48,0.08)] dark:bg-[rgba(255,255,255,0.07)]" />

      {/* Lightning address */}
      <SettingRow
        icon={<Zap size={16} color={dark ? "#ffb05a" : "#b45004"} />}
        label={identity.lud16 ? "Lightning address" : "Conectar billetera Lightning"}
        right={
          identity.lud16 ? (
            <Text
              className="font-label text-xs"
              style={{ color: dark ? glassText.dark.secondary : glassText.light.secondary }}
              numberOfLines={1}
            >
              {identity.lud16.length > 24
                ? `${identity.lud16.slice(0, 20)}…`
                : identity.lud16}
            </Text>
          ) : (
            <GlassView level="crepusculo" className="rounded-full px-2 py-0.5">
              <Text
                className="font-label text-xs"
                style={{ color: dark ? "#ffb05a" : "#b03807" }}
              >
                Conectar
              </Text>
            </GlassView>
          )
        }
      />

      {/* Divider */}
      <View className="mx-4 h-px bg-[rgba(30,39,48,0.08)] dark:bg-[rgba(255,255,255,0.07)]" />

      {/* Sign out */}
      <SettingRow
        icon={<LogOut size={16} color={dark ? "#ffb05a" : "#b03807"} />}
        label="Cerrar sesión"
        onPress={handleSignOut}
        destructive
      />
    </GlassView>
  );
}
