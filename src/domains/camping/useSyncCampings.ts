import { useEffect } from "react";

import { supabase } from "@/src/infrastructure/supabase/client";
import { storage } from "@/src/infrastructure/storage/mmkv";
import { upsertCamping } from "@/src/infrastructure/storage/campingDatabase";

const SYNC_KEY = "camping-sync-timestamp";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

// Argentina bounding box
const ARGENTINA_BOUNDS = {
  min_lat: -55.0,
  max_lat: -21.0,
  min_lng: -73.5,
  max_lng: -53.5,
};

type BBoxRow = {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  province: string;
  geohash: string;
  amenities: Record<string, boolean>;
  prices: Record<string, number> | null;
  contact: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  } | null;
  photos: string[];
  source: "sinta" | "scraped" | "community" | "osm";
  verified: boolean;
  owner_npub: string | null;
  owner_lightning_address: string | null;
  created_at: string;
  updated_at: string;
};

async function syncAllCampings(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(
    "get_campings_in_bbox",
    ARGENTINA_BOUNDS,
  );

  if (error) throw error;
  if (!data) return;

  const rows = data as BBoxRow[];

  for (const row of rows) {
    await upsertCamping({
      id: row.id,
      name: row.name,
      slug: row.slug,
      latitude: row.latitude,
      longitude: row.longitude,
      province: row.province,
      geohash: row.geohash,
      amenities: JSON.stringify(row.amenities ?? {}),
      prices: row.prices ? JSON.stringify(row.prices) : null,
      contact: row.contact ? JSON.stringify(row.contact) : null,
      photos: row.photos ? JSON.stringify(row.photos) : null,
      source: row.source,
      verified: row.verified,
      owner_npub: row.owner_npub,
      owner_lightning_address: row.owner_lightning_address,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  storage.set(SYNC_KEY, Date.now());
}

/**
 * Syncs all Argentinian campings from Supabase → SQLite once every 24h.
 * Safe to call from any screen — throttled by MMKV timestamp.
 */
export function useSyncCampings(): void {
  useEffect(() => {
    const lastSync = storage.getNumber(SYNC_KEY) ?? 0;
    const shouldSync = Date.now() - lastSync > SYNC_INTERVAL_MS;

    if (!shouldSync) return;

    syncAllCampings().catch((err) => {
      console.warn("[useSyncCampings] sync failed:", err);
    });
  }, []);
}
