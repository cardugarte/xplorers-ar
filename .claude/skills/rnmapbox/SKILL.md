---
name: rnmapbox
description: >
  @rnmapbox/maps v10 patterns for Mapbox GL.
  Trigger: When working with maps - MapView, Camera, markers, clustering, offline.
license: Apache-2.0
metadata:
  author: xplorers
  version: "1.0"
---

## Setup

```typescript
// src/infrastructure/mapbox/client.ts — called at module scope before any MapView
import Mapbox from "@rnmapbox/maps";
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "");
```

Cannot run in Expo Go — requires EAS Build dev client.

## Style URLs

```typescript
Mapbox.StyleURL.Street          // mapbox://styles/mapbox/streets-v12
Mapbox.StyleURL.Outdoors        // mapbox://styles/mapbox/outdoors-v12 (project default)
Mapbox.StyleURL.Light           // mapbox://styles/mapbox/light-v11
Mapbox.StyleURL.Dark            // mapbox://styles/mapbox/dark-v11
Mapbox.StyleURL.Satellite       // mapbox://styles/mapbox/satellite-v9
Mapbox.StyleURL.SatelliteStreet // mapbox://styles/mapbox/satellite-streets-v12
```

## MapView + Camera (REQUIRED Pattern)

```tsx
import MapboxGL, { type Camera } from "@rnmapbox/maps";
import { useRef } from "react";

function MapScreen() {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<Camera>(null);

  return (
    <View style={{ flex: 1 }}>
      {/* ✅ Use style prop, NOT className — native view */}
      <MapboxGL.MapView
        ref={mapRef}
        style={{ flex: 1 }}
        styleURL={Mapbox.StyleURL.Outdoors}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [-63.6167, -38.4161], // [lon, lat]
            zoomLevel: 4,
            pitch: 0,
            heading: 0,
          }}
          minZoomLevel={3}
          maxZoomLevel={18}
        />
      </MapboxGL.MapView>
    </View>
  );
}
```

`defaultSettings` = initial position only, does NOT re-trigger on changes. Use props or ref methods for reactive updates.

## Camera Ref Methods

```typescript
cameraRef.current?.zoomTo(level, duration?);
cameraRef.current?.flyTo([lon, lat], duration?);
cameraRef.current?.moveTo([lon, lat], duration?);
cameraRef.current?.fitBounds(ne, sw, padding?, duration?);
cameraRef.current?.setCamera({ centerCoordinate, zoomLevel, heading, pitch, animationDuration });
```

## MapView Ref Methods

```typescript
await mapRef.current?.getZoom();            // Promise<number>
await mapRef.current?.getCenter();          // Promise<[lon, lat]>
await mapRef.current?.getVisibleBounds();   // Promise<{ne, sw}>
await mapRef.current?.getCoordinateFromView([x, y]);  // screen to geo
await mapRef.current?.getPointInView([lon, lat]);      // geo to screen
```

## Events (v10 Preferred)

```tsx
<MapboxGL.MapView
  onPress={(feature) => console.log(feature.geometry.coordinates)}
  onLongPress={(feature) => handleLongPress(feature)}
  onCameraChanged={(state) => {
    // state.properties: { center, bounds, zoom, heading, pitch }
    // state.gestures: { isGestureActive }
  }}
  onMapIdle={(state) => {
    // Fires when camera stops — use for loading data by viewport
  }}
/>
```

## Markers: 3 Approaches (Performance Order)

### 1. ShapeSource + SymbolLayer (BEST: 100+ markers)

```tsx
<MapboxGL.Images images={{ pin: require("./pin.png") }} />
<MapboxGL.ShapeSource id="campings" shape={geojson} onPress={handlePress}>
  <MapboxGL.SymbolLayer
    id="camping-icons"
    style={{
      iconImage: "pin",
      iconSize: 0.8,
      iconAllowOverlap: true,
      iconAnchor: "bottom",
    }}
  />
</MapboxGL.ShapeSource>
```

Renders as native tiles. Handles thousands of points. Supports clustering.

### 2. MarkerView (Interactive React views, max ~100)

```tsx
<MapboxGL.MarkerView coordinate={[lon, lat]} anchor={{ x: 0.5, y: 1 }}>
  <Pressable onPress={handlePress}>
    <CustomComponent />
  </Pressable>
</MapboxGL.MarkerView>
```

Each marker = real React Native view. Attach press handlers to children.

### 3. PointAnnotation (Legacy — prefer MarkerView)

Children rendered to bitmap. Use `fadeDuration={0}` on Image children.

## Clustering

```tsx
<MapboxGL.ShapeSource
  id="campings"
  shape={featureCollection}
  cluster={true}
  clusterRadius={50}
  clusterMaxZoomLevel={14}
>
  <MapboxGL.CircleLayer
    id="clusters"
    filter={["has", "point_count"]}
    style={{
      circleColor: ["step", ["get", "point_count"], "#51bbd6", 100, "#f1f075", 750, "#f28cb1"],
      circleRadius: ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    }}
  />
  <MapboxGL.SymbolLayer
    id="cluster-count"
    filter={["has", "point_count"]}
    style={{ textField: "{point_count}", textSize: 12, textColor: "#fff" }}
  />
  <MapboxGL.CircleLayer
    id="unclustered"
    filter={["!", ["has", "point_count"]]}
    style={{ circleRadius: 8, circleColor: "#11b4da" }}
  />
</MapboxGL.ShapeSource>
```

## User Location

```tsx
// Display puck (native, performant)
<MapboxGL.LocationPuck visible puckBearing="heading" puckBearingEnabled />

// Track location data
<MapboxGL.UserLocation
  visible={false}
  onUpdate={(location) => {
    const { longitude, latitude } = location.coords;
  }}
/>
```

## Offline Packs

```typescript
import { offlineManager } from "@rnmapbox/maps";

await offlineManager.createPack({
  name: "bariloche",
  styleURL: Mapbox.StyleURL.Outdoors,
  bounds: [[swLon, swLat], [neLon, neLat]],
  minZoom: 10,
  maxZoom: 16,
}, progressCallback, errorCallback);

const packs = await offlineManager.getPacks();
await offlineManager.deletePack("bariloche");
```

## Performance Tips

1. **Memoize GeoJSON** — ShapeSource re-renders when `shape` reference changes
2. **Memoize callbacks** — prevent MapView re-renders
3. **Use refs** for imperative ops (camera, zoom) instead of reactive props
4. **ShapeSource > MarkerView** for 100+ markers
5. **Enable clustering** for large datasets
6. **`regionDidChangeDebounceTime`** defaults to 500ms — use `onMapIdle` for viewport data loading

## Keywords
mapbox, rnmapbox, map, camera, markers, clustering, shapesource, offline, geojson
