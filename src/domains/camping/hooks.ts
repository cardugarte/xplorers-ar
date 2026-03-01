import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { supabase } from "@/src/infrastructure/supabase/client";
import { useDebouncedValue } from "@/src/shared/hooks/useDebouncedValue";
import type { ViewportBounds } from "@/src/domains/map/types";

import { useFilterStore } from "./store";
import type { Camping } from "./types";

export function useCampingsNear(lat: number, lng: number, radiusKm = 50) {
  return useQuery({
    queryKey: ["campings", "near", lat, lng, radiusKm],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_campings_near", {
        lat,
        lng,
        radius_km: radiusKm,
        lim: 100,
      });

      if (error) throw error;
      return data as unknown as (Camping & { distance_km: number })[];
    },
    enabled: lat !== 0 && lng !== 0,
  });
}

export function useCampingsInBBox(bounds: ViewportBounds | null) {
  return useQuery({
    queryKey: [
      "campings",
      "bbox",
      bounds?.minLat,
      bounds?.minLng,
      bounds?.maxLat,
      bounds?.maxLng,
    ],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.rpc as any)("get_campings_in_bbox", {
        min_lat: bounds!.minLat,
        min_lng: bounds!.minLng,
        max_lat: bounds!.maxLat,
        max_lng: bounds!.maxLng,
      });
      if (!data) throw new Error("get_campings_in_bbox returned null");

      return data as unknown as Camping[];
    },
    enabled: bounds !== null,
    placeholderData: keepPreviousData,
  });
}

export function useCamping(id: string) {
  return useQuery({
    queryKey: ["campings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSearchCampings() {
  const { searchQuery, provinces, types, requiredAmenities } = useFilterStore(
    useShallow((s) => ({
      searchQuery: s.searchQuery,
      provinces: s.provinces,
      types: s.types,
      requiredAmenities: s.requiredAmenities,
    })),
  );

  const debouncedQuery = useDebouncedValue(searchQuery);

  return useQuery({
    queryKey: [
      "campings",
      "search",
      debouncedQuery,
      provinces,
      types,
      requiredAmenities,
    ],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "search_and_filter_campings",
        {
          query: debouncedQuery,
          provinces,
          types,
          required_amenities: requiredAmenities,
          lim: 50,
          off_set: 0,
        },
      );

      if (error) throw error;
      return data as unknown as Camping[];
    },
    placeholderData: keepPreviousData,
  });
}

export function useCampingsByProvince(province: string) {
  return useQuery({
    queryKey: ["campings", "province", province],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campings")
        .select("*")
        .eq("province", province)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!province,
  });
}
