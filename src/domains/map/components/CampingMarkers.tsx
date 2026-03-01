import MapboxGL from "@rnmapbox/maps";
import { useRouter } from "expo-router";
import { useCallback, useRef } from "react";

import type { CampingFeatureCollection } from "../geojson";
import {
  CLUSTER_BASE_COLOR,
  CLUSTER_BASE_RADIUS,
  CLUSTER_COLOR_STEPS,
  CLUSTER_RADIUS_STEPS,
  MARKER_COLORS,
} from "../markers";

interface CampingMarkersProps {
  geojson: CampingFeatureCollection;
  cameraRef: React.RefObject<MapboxGL.Camera | null>;
}

export function CampingMarkers({ geojson, cameraRef }: CampingMarkersProps) {
  const router = useRouter();
  const shapeSourceRef = useRef<MapboxGL.ShapeSource>(null);

  const handlePress = useCallback(
    async (event: GeoJSON.Feature) => {
      const properties = event.properties;
      if (!properties) return;

      // Cluster tap → zoom to expand
      if (properties.cluster) {
        const zoom =
          await shapeSourceRef.current?.getClusterExpansionZoom(event);
        const coordinates = (event.geometry as GeoJSON.Point).coordinates;
        cameraRef.current?.setCamera({
          centerCoordinate: coordinates as [number, number],
          zoomLevel: zoom ?? 14,
          animationDuration: 500,
        });
        return;
      }

      // Individual marker tap → navigate to detail
      const id = properties.id as string;
      if (id) {
        router.push(`/camping/${id}`);
      }
    },
    [cameraRef, router],
  );

  return (
    <MapboxGL.ShapeSource
      ref={shapeSourceRef}
      id="campings"
      shape={geojson}
      cluster
      clusterRadius={50}
      clusterMaxZoomLevel={14}
      onPress={(e) => handlePress(e.features[0])}
    >
      {/* Cluster circles */}
      <MapboxGL.CircleLayer
        id="camping-clusters"
        filter={["has", "point_count"]}
        style={{
          circleColor: [
            "step",
            ["get", "point_count"],
            CLUSTER_BASE_COLOR,
            ...CLUSTER_COLOR_STEPS,
          ],
          circleRadius: [
            "step",
            ["get", "point_count"],
            CLUSTER_BASE_RADIUS,
            ...CLUSTER_RADIUS_STEPS,
          ],
          circleOpacity: 0.85,
          circleStrokeWidth: 2,
          circleStrokeColor: "#fff",
        }}
      />

      {/* Cluster count label */}
      <MapboxGL.SymbolLayer
        id="camping-cluster-count"
        filter={["has", "point_count"]}
        style={{
          textField: [
            "concat",
            ["to-string", ["get", "point_count"]],
          ],
          textSize: 13,
          textColor: "#ffffff",
          textFont: ["DIN Pro Medium", "Arial Unicode MS Bold"],
          textAllowOverlap: true,
        }}
      />

      {/* Individual marker circles */}
      <MapboxGL.CircleLayer
        id="camping-markers"
        filter={["!", ["has", "point_count"]]}
        style={{
          circleRadius: 8,
          circleColor: [
            "match",
            ["get", "type"],
            "municipal",
            MARKER_COLORS.municipal,
            "nacional",
            MARKER_COLORS.nacional,
            "privado",
            MARKER_COLORS.privado,
            "libre",
            MARKER_COLORS.libre,
            MARKER_COLORS.unknown,
          ],
          circleStrokeWidth: 2,
          circleStrokeColor: "#ffffff",
        }}
      />

      {/* Camping name label (visible at zoom >= 10) */}
      <MapboxGL.SymbolLayer
        id="camping-labels"
        filter={["!", ["has", "point_count"]]}
        minZoomLevel={10}
        style={{
          textField: ["get", "name"],
          textSize: 12,
          textColor: "#1e2730",
          textFont: ["DIN Pro Medium", "Arial Unicode MS Regular"],
          textOffset: [0, 1.5],
          textAnchor: "top",
          textMaxWidth: 10,
          textHaloColor: "#ffffff",
          textHaloWidth: 1.5,
          textOptional: true,
          textAllowOverlap: false,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
