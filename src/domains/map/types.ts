export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapBounds {
  ne: { latitude: number; longitude: number };
  sw: { latitude: number; longitude: number };
}

export interface OfflinePack {
  id: string;
  name: string;
  bounds: MapBounds;
  minZoom: number;
  maxZoom: number;
  progress: number;
  size: number;
  createdAt: string;
}

export const ARGENTINA_CENTER: MapRegion = {
  latitude: -38.4161,
  longitude: -63.6167,
  latitudeDelta: 30,
  longitudeDelta: 20,
};

export const POPULAR_ZONES = [
  {
    id: "bariloche",
    name: "Bariloche y Circuito de Lagos",
    bounds: {
      ne: { latitude: -40.5, longitude: -71.0 },
      sw: { latitude: -41.5, longitude: -72.0 },
    },
  },
  {
    id: "mendoza",
    name: "Mendoza",
    bounds: {
      ne: { latitude: -32.0, longitude: -68.0 },
      sw: { latitude: -35.0, longitude: -70.5 },
    },
  },
  {
    id: "patagonia-norte",
    name: "Patagonia Norte",
    bounds: {
      ne: { latitude: -38.0, longitude: -68.0 },
      sw: { latitude: -43.0, longitude: -72.0 },
    },
  },
  {
    id: "cordoba-sierras",
    name: "Sierras de Córdoba",
    bounds: {
      ne: { latitude: -30.5, longitude: -63.5 },
      sw: { latitude: -32.5, longitude: -65.5 },
    },
  },
  {
    id: "patagonia-sur",
    name: "Patagonia Sur",
    bounds: {
      ne: { latitude: -43.0, longitude: -65.0 },
      sw: { latitude: -55.0, longitude: -72.0 },
    },
  },
] as const;

// ─── Mapbox camera ───

export const ARGENTINA_CAMERA = {
  center: [-63.6167, -38.4161] as [number, number],
  zoom: 4,
  pitch: 0,
  heading: 0,
} as const;

/** Convert MapBounds to Mapbox [ne, sw] format with [lon, lat] pairs. */
export function toMapboxBounds(
  bounds: MapBounds,
): { ne: [number, number]; sw: [number, number] } {
  return {
    ne: [bounds.ne.longitude, bounds.ne.latitude],
    sw: [bounds.sw.longitude, bounds.sw.latitude],
  };
}
