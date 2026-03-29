import { useMutation } from "@tanstack/react-query";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";
import type { Camping } from "@/src/domains/camping/types";

/**
 * Build geohash tags at multiple precisions for area queries.
 * Convention: precision 3 (~156km), 4 (~39km), 5 (~5km).
 */
function buildGeohashTags(geohash: string): string[][] {
  const tags: string[][] = [];
  for (let p = 3; p <= Math.min(geohash.length, 5); p++) {
    tags.push(["g", geohash.slice(0, p)]);
  }
  return tags;
}

/**
 * Build amenity tags from the camping amenities object.
 * Each truthy amenity becomes a ["t", "<amenity>"] tag.
 */
function buildAmenityTags(amenities: Record<string, unknown>): string[][] {
  return Object.entries(amenities)
    .filter(([, v]) => v === true)
    .map(([key]) => ["t", key]);
}

interface PublishVenueParams {
  camping: Camping;
  /** Hex pubkey of the Xplorers app keypair */
  appPubkey?: string;
}

/**
 * Publish a camping as a kind:37515 addressable event on Nostr.
 *
 * The `d` tag is the camping slug, making it uniquely identifiable
 * as `37515:<pubkey>:<slug>`. Re-publishing replaces the previous event.
 */
export function useVenuePublish() {
  const { ndk, currentUser } = useNDK();

  return useMutation({
    mutationKey: ["nostr", "venue", "publish"],
    mutationFn: async ({ camping, appPubkey }: PublishVenueParams) => {
      if (!ndk) throw new Error("NDK no está disponible");
      if (!ndk.connected) {
        throw new Error("NDK no está conectado a relays");
      }

      const event = ndk.createEvent();
      event.kind = NOSTR_KINDS.CAMPING_VENUE;

      event.content = JSON.stringify({
        name: camping.name,
        description: camping.contact ? undefined : undefined,
        website: camping.contact?.website,
        phone: camping.contact?.phone,
        amenities: camping.amenities,
        prices: camping.prices,
      });

      event.tags = [
        ["d", camping.slug],
        ["name", camping.name],
        ...buildGeohashTags(camping.geohash),
        ["location", `${camping.latitude},${camping.longitude}`, camping.province],
        ["t", "camping"],
        ...(camping.type ? [["t", camping.type]] : []),
        ...buildAmenityTags(camping.amenities),
      ];

      event.publish();

      return {
        venueRef: `${NOSTR_KINDS.CAMPING_VENUE}:${appPubkey ?? currentUser?.pubkey ?? ""}:${camping.slug}`,
        slug: camping.slug,
      };
    },
  });
}

export { buildGeohashTags };
