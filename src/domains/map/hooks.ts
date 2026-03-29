import type { MapState } from "@rnmapbox/maps";
import { offlineManager } from "@rnmapbox/maps";
import { useCallback, useEffect, useState } from "react";

import { toViewportBounds, toMapboxBounds, POPULAR_ZONES, type ViewportBounds, type MapBounds } from "./types";

// Inline types not exported from @rnmapbox/maps package root
type OfflineProgressStatus = {
  name: string;
  state: number;
  percentage: number;
  completedResourceSize: number;
  completedTileCount: number;
  completedResourceCount: number;
  requiredResourceCount: number;
  completedTileSize: number;
};

type OfflinePackError = {
  name: string;
  message: string;
};

export function useViewportBounds() {
  const [bounds, setBounds] = useState<ViewportBounds | null>(null);

  const handleMapIdle = useCallback((state: MapState) => {
    const { ne, sw } = state.properties.bounds;
    setBounds(
      toViewportBounds(
        ne as [number, number],
        sw as [number, number],
      ),
    );
  }, []);

  return { bounds, handleMapIdle } as const;
}

// ─── Tile count limits per zone ───────────────────────────────────────────────

const ZONE_MAX_ZOOM: Record<string, number> = {
  "patagonia-sur": 12,
};

const DEFAULT_MAX_ZOOM = 14;
const DEFAULT_MIN_ZOOM = 8;
const MAPBOX_STYLE = "mapbox://styles/mapbox/outdoors-v12";

// ─── Offline pack state ───────────────────────────────────────────────────────

export type OfflinePackInfo = {
  zoneId: string;
  name: string;
  isDownloaded: boolean;
};

/**
 * Returns the list of POPULAR_ZONES enriched with download status.
 * Re-checks whenever called (no reactive subscription — call after mutations).
 */
export function useOfflinePacks() {
  const [packs, setPacks] = useState<OfflinePackInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const downloaded = await offlineManager.getPacks();
      const downloadedNames = new Set(downloaded.map((p) => p.name));

      setPacks(
        POPULAR_ZONES.map((zone) => ({
          zoneId: zone.id,
          name: zone.name,
          isDownloaded: downloadedNames.has(zone.id),
        })),
      );
    } catch (err) {
      console.warn("[useOfflinePacks] getPacks failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { packs, isLoading, refresh } as const;
}

// ─── Offline pack download / delete ──────────────────────────────────────────

export type DownloadState = "idle" | "downloading" | "done" | "error";

/**
 * Hook for downloading or deleting a single offline map pack by zone ID.
 * Progress goes 0–100. Call `startDownload()` or `deletePack()` from UI.
 */
export function useOfflinePackDownload(zoneId: string) {
  const zone = POPULAR_ZONES.find((z) => z.id === zoneId);

  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startDownload = useCallback(async () => {
    if (!zone) {
      setError(`Zona desconocida: ${zoneId}`);
      return;
    }

    setDownloadState("downloading");
    setProgress(0);
    setError(null);

    const mapboxBounds = toMapboxBounds(zone.bounds as MapBounds);
    const bounds: [GeoJSON.Position, GeoJSON.Position] = [
      [mapboxBounds.ne[0], mapboxBounds.ne[1]],
      [mapboxBounds.sw[0], mapboxBounds.sw[1]],
    ];
    const maxZoom = ZONE_MAX_ZOOM[zoneId] ?? DEFAULT_MAX_ZOOM;

    try {
      await offlineManager.createPack(
        {
          name: zoneId,
          styleURL: MAPBOX_STYLE,
          minZoom: DEFAULT_MIN_ZOOM,
          maxZoom,
          bounds,
        },
        (_pack: unknown, status: OfflineProgressStatus) => {
          setProgress(Math.round(status.percentage));
          // state 2 = complete
          if (status.state === 2) {
            setDownloadState("done");
          }
        },
        (_pack: unknown, err: OfflinePackError) => {
          console.warn("[useOfflinePackDownload] error:", err.message);
          setError(err.message);
          setDownloadState("error");
        },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setDownloadState("error");
    }
  }, [zone, zoneId]);

  const deletePack = useCallback(async () => {
    try {
      await offlineManager.deletePack(zoneId);
      setDownloadState("idle");
      setProgress(0);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, [zoneId]);

  // Cleanup listener on unmount
  useEffect(() => {
    return () => {
      offlineManager.unsubscribe(zoneId);
    };
  }, [zoneId]);

  return { downloadState, progress, error, startDownload, deletePack } as const;
}
