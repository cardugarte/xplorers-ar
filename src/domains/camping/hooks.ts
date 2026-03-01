import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/src/infrastructure/supabase/client";

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
