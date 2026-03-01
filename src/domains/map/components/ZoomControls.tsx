import type MapboxGL from "@rnmapbox/maps";
import type { Camera } from "@rnmapbox/maps";
import { Minus, Plus } from "lucide-react-native";
import { Pressable, View, useColorScheme } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

interface ZoomControlsProps {
  mapRef: React.RefObject<MapboxGL.MapView | null>;
  cameraRef: React.RefObject<Camera | null>;
}

const ICON_SIZE = 22;
const ANIMATION_MS = 300;

export function ZoomControls({ mapRef, cameraRef }: ZoomControlsProps) {
  const dark = useColorScheme() === "dark";
  const iconColor = dark ? glassText.dark.primary : glassText.light.primary;

  const handleZoom = async (direction: 1 | -1) => {
    const map = mapRef.current;
    const camera = cameraRef.current;
    if (!map || !camera) return;

    const currentZoom = await map.getZoom();
    camera.zoomTo(currentZoom + direction, ANIMATION_MS);
  };

  return (
    <View className="absolute bottom-28 right-4 gap-2">
      <Pressable onPress={() => handleZoom(1)}>
        <GlassView
          level="ultra"
          blur
          style={{ borderRadius: 12, padding: 10 }}
        >
          <Plus size={ICON_SIZE} color={iconColor} strokeWidth={2.5} />
        </GlassView>
      </Pressable>

      <Pressable onPress={() => handleZoom(-1)}>
        <GlassView
          level="ultra"
          blur
          style={{ borderRadius: 12, padding: 10 }}
        >
          <Minus size={ICON_SIZE} color={iconColor} strokeWidth={2.5} />
        </GlassView>
      </Pressable>
    </View>
  );
}
