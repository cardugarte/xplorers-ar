import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import type { NDKEventData } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";
import { storage } from "@/src/infrastructure/storage/mmkv";

import { buildGeohashTags } from "./useVenuePublish";
import type { CheckIn } from "./types";

/** Minimum distance in meters to check in at a camping */
const CHECK_IN_RADIUS_M = 500;

/** Minimum interval in ms between check-ins at the same camping */
const CHECK_IN_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/**
 * Calculate distance in meters between two points using the Haversine formula.
 */
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check if the user is close enough to a camping for a check-in.
 */
export function isNearCamping(
  userLat: number,
  userLng: number,
  campingLat: number,
  campingLng: number,
): { isNear: boolean; distanceM: number } {
  const distanceM = haversineMeters(userLat, userLng, campingLat, campingLng);
  return { isNear: distanceM <= CHECK_IN_RADIUS_M, distanceM };
}

/**
 * MMKV key for tracking last check-in time at a camping.
 */
function lastCheckInKey(campingId: string): string {
  return `checkin:last:${campingId}`;
}

/**
 * Check if cooldown has elapsed since last check-in at this camping.
 */
export function canCheckIn(campingId: string): boolean {
  const lastStr = storage.getString(lastCheckInKey(campingId));
  if (!lastStr) return true;
  const last = parseInt(lastStr, 10);
  return Date.now() - last >= CHECK_IN_COOLDOWN_MS;
}

function eventToCheckIn(event: NDKEventData): CheckIn {
  const geohashTag = event.tags.find(([key]) => key === "g");
  const aTag = event.tags.find(([key]) => key === "a");

  return {
    id: event.id,
    event_id: event.id,
    camping_id: aTag?.[1] ?? "",
    author_npub: event.pubkey,
    geohash: geohashTag?.[1] ?? "",
    created_at: event.created_at,
  };
}

interface CheckInParams {
  campingName: string;
  campingId: string;
  campingSlug: string;
  venuePubkey: string;
  geohash: string;
  lat: number;
  lng: number;
  userLat: number;
  userLng: number;
}

/**
 * Publish a check-in at a camping.
 *
 * Publishes two events:
 * 1. kind:1 — permanent social note with geo tags
 * 2. kind:30315 — user status update (replaceable)
 *
 * Requires GPS proximity verification (<= 500m).
 */
export function useCheckIn() {
  const { ndk, currentUser } = useNDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["nostr", "checkin", "publish"],
    mutationFn: async (params: CheckInParams) => {
      if (!currentUser) {
        throw new Error("Necesitás iniciar sesión para hacer check-in");
      }

      // Proximity check
      const { isNear, distanceM } = isNearCamping(
        params.userLat,
        params.userLng,
        params.lat,
        params.lng,
      );
      if (!isNear) {
        throw new Error(
          `Tenés que estar a menos de ${CHECK_IN_RADIUS_M}m del camping (estás a ${Math.round(distanceM)}m)`,
        );
      }

      // Cooldown check
      if (!canCheckIn(params.campingId)) {
        throw new Error("Ya hiciste check-in en este camping hace menos de 1 hora");
      }

      const venueRef = `${NOSTR_KINDS.CAMPING_VENUE}:${params.venuePubkey}:${params.campingSlug}`;

      // 1. Publish check-in note (kind:1)
      const note = ndk.createEvent();
      note.kind = NOSTR_KINDS.SHORT_TEXT_NOTE;
      note.content = `Estoy en: ${params.campingName} #camping #xplorers`;
      note.tags = [
        ["a", venueRef],
        ...buildGeohashTags(params.geohash),
        ["t", "camping"],
        ["t", "xplorers"],
        ["t", "checkin"],
      ];
      note.publish();

      // 2. Update user status (kind:30315)
      const status = ndk.createEvent();
      status.kind = NOSTR_KINDS.STATUS;
      status.content = params.campingName;
      status.tags = [
        ["d", "general"],
        ["a", venueRef],
        ...buildGeohashTags(params.geohash),
        ["r", "camping"],
      ];
      status.publish();

      // Record timestamp in MMKV for cooldown
      storage.set(lastCheckInKey(params.campingId), String(Date.now()));

      return { campingName: params.campingName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nostr", "checkins"] });
      queryClient.invalidateQueries({ queryKey: ["nostr", "feed"] });
    },
  });
}

/**
 * Fetch check-in history for a user.
 */
export function useCheckInHistory(pubkey: string | null) {
  const { ndk } = useNDK();

  return useQuery({
    queryKey: ["nostr", "checkins", pubkey],
    queryFn: async (): Promise<CheckIn[]> => {
      if (!pubkey) return [];

      const events = await ndk.fetchEvents({
        kinds: [NOSTR_KINDS.SHORT_TEXT_NOTE],
        authors: [pubkey],
        "#t": ["checkin"],
      });

      return events
        .map(eventToCheckIn)
        .sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!pubkey,
    staleTime: 60_000,
  });
}
