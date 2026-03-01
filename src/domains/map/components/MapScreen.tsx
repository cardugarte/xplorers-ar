import MapboxGL, { type Camera } from "@rnmapbox/maps";
import { useRef } from "react";
import { View } from "react-native";

import { ARGENTINA_CAMERA } from "@/src/domains/map/types";

import { ZoomControls } from "./ZoomControls";

const STYLE_URL = "mapbox://styles/mapbox/outdoors-v12";

export function MapScreen() {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<Camera>(null);

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView
        ref={mapRef}
        style={{ flex: 1 }}
        styleURL={STYLE_URL}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: ARGENTINA_CAMERA.center as [number, number],
            zoomLevel: ARGENTINA_CAMERA.zoom,
            pitch: ARGENTINA_CAMERA.pitch,
            heading: ARGENTINA_CAMERA.heading,
          }}
          minZoomLevel={3}
          maxZoomLevel={18}
        />
      </MapboxGL.MapView>

      <ZoomControls mapRef={mapRef} cameraRef={cameraRef} />
    </View>
  );
}
