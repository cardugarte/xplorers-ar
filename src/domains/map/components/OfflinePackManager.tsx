import { WifiOff } from "lucide-react-native";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { useOfflinePacks } from "@/src/domains/map/hooks";
import { OfflinePackCard } from "./OfflinePackCard";

/**
 * Screen for managing offline map packs.
 * Shows all POPULAR_ZONES as downloadable cards with progress and delete options.
 */
export function OfflinePackManager() {
  const { packs, isLoading, refresh } = useOfflinePacks();

  return (
    <ScrollView
      className="flex-1 bg-transparent"
      contentContainerClassName="p-4 pb-8"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <GlassView level="ultra" blur className="rounded-2xl p-4 mb-5">
        <View className="flex-row items-center gap-3">
          <WifiOff size={22} color="rgba(255,255,255,0.9)" />
          <View className="flex-1">
            <Text className="text-base font-heading text-white">
              Mapas sin conexión
            </Text>
            <Text className="text-xs font-body text-white/70 mt-0.5">
              Descargá zonas para navegar sin internet
            </Text>
          </View>
        </View>
      </GlassView>

      {/* Pack list */}
      {isLoading ? (
        <View className="items-center py-10">
          <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" />
          <Text className="text-sm font-body text-white/60 mt-3">
            Cargando packs…
          </Text>
        </View>
      ) : (
        packs.map((pack) => (
          <OfflinePackCard key={pack.zoneId} pack={pack} onRefresh={refresh} />
        ))
      )}

      {/* Storage hint */}
      <Text className="text-xs font-body text-white/40 text-center mt-2">
        Cada zona ocupa aproximadamente 2–5 MB (Patagonia Sur hasta 10 MB)
      </Text>
    </ScrollView>
  );
}
