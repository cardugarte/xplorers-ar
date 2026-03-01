import MapboxGL, { type Camera } from "@rnmapbox/maps";
import { useMemo, useRef } from "react";
import { View } from "react-native";

import { useCampingsInBBox } from "@/src/domains/camping/hooks";

import { campingsToGeoJSON } from "../geojson";
import { useViewportBounds } from "../hooks";
import { ARGENTINA_CAMERA } from "../types";
import { CampingMarkers } from "./CampingMarkers";
import { ZoomControls } from "./ZoomControls";

const STYLE_URL = "mapbox://styles/mapbox/outdoors-v12";

export function MapScreen() {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<Camera>(null);

  const { bounds, handleMapIdle } = useViewportBounds();
  const { data: campings } = useCampingsInBBox(bounds);

  const geojson = useMemo(
    () => campingsToGeoJSON(campings ?? []),
    [campings],
  );

  return (
    <View style={{ flex: 1 }}>
      <MapboxGL.MapView
        ref={mapRef}
        style={{ flex: 1 }}
        styleURL={STYLE_URL}
        compassEnabled={false}
        scaleBarEnabled={false}
        onMapIdle={handleMapIdle}
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

        <CampingMarkers geojson={geojson} cameraRef={cameraRef} />
      </MapboxGL.MapView>

      <ZoomControls mapRef={mapRef} cameraRef={cameraRef} />
    </View>
  );
}
