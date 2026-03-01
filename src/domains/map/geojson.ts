import type { Camping } from "@/src/domains/camping/types";

export interface CampingFeatureProperties {
  id: string;
  name: string;
  type: string;
  province: string;
  slug: string;
}

export type CampingFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  CampingFeatureProperties
>;

export function campingsToGeoJSON(
  campings: Camping[],
): CampingFeatureCollection {
  return {
    type: "FeatureCollection",
    features: campings.map((c) => ({
      type: "Feature",
      id: c.id,
      geometry: {
        type: "Point",
        coordinates: [c.longitude, c.latitude],
      },
      properties: {
        id: c.id,
        name: c.name,
        type: c.type ?? "unknown",
        province: c.province,
        slug: c.slug,
      },
    })),
  };
}
