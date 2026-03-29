import { Download, Trash2, CheckCircle, AlertCircle, Loader } from "lucide-react-native";
import { Text, View, TouchableOpacity } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import type { OfflinePackInfo } from "@/src/domains/map/hooks";
import { useOfflinePackDownload } from "@/src/domains/map/hooks";

interface OfflinePackCardProps {
  pack: OfflinePackInfo;
  onRefresh: () => void;
}

export function OfflinePackCard({ pack, onRefresh }: OfflinePackCardProps) {
  const { downloadState, progress, error, startDownload, deletePack } =
    useOfflinePackDownload(pack.zoneId);

  const isDownloading = downloadState === "downloading";
  const isDone = downloadState === "done" || pack.isDownloaded;
  const hasError = downloadState === "error";

  async function handleDelete() {
    await deletePack();
    onRefresh();
  }

  async function handleDownload() {
    await startDownload();
    onRefresh();
  }

  return (
    <GlassView level="soft" className="rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between">
        {/* Zone name + status */}
        <View className="flex-1 mr-3">
          <Text className="text-base font-heading text-white" numberOfLines={1}>
            {pack.name}
          </Text>

          {isDownloading && (
            <Text className="text-xs font-body text-white/70 mt-0.5">
              Descargando… {progress}%
            </Text>
          )}

          {isDone && !isDownloading && (
            <Text className="text-xs font-body text-green-400 mt-0.5">
              Disponible sin conexión
            </Text>
          )}

          {hasError && error && (
            <Text className="text-xs font-body text-red-400 mt-0.5" numberOfLines={2}>
              {error}
            </Text>
          )}
        </View>

        {/* Action button */}
        <View className="flex-row items-center gap-2">
          {isDownloading ? (
            <View className="w-9 h-9 items-center justify-center">
              <Loader size={20} color="rgba(255,255,255,0.7)" />
            </View>
          ) : isDone ? (
            <>
              <CheckCircle size={18} color="#4ade80" />
              <TouchableOpacity
                onPress={handleDelete}
                className="w-9 h-9 items-center justify-center rounded-full bg-white/10"
                accessibilityLabel={`Eliminar mapa de ${pack.name}`}
              >
                <Trash2 size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleDownload}
              className="w-9 h-9 items-center justify-center rounded-full bg-white/10"
              accessibilityLabel={`Descargar mapa de ${pack.name}`}
            >
              {hasError ? (
                <AlertCircle size={18} color="#f87171" />
              ) : (
                <Download size={18} color="rgba(255,255,255,0.9)" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress bar */}
      {isDownloading && (
        <View className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <View
            className="h-full bg-glaciar-400 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      )}
    </GlassView>
  );
}
