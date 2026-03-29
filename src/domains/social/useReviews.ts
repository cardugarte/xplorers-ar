import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import type { NDKEventData } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";

import type { Review } from "./types";

/** Default relay hint for venue references */
const DEFAULT_RELAY = "wss://relay.damus.io";

/**
 * Parse a kind:1111 event into our Review domain type.
 */
function eventToReview(event: NDKEventData): Review {
  const ratingTag = event.tags.find(([key]) => key === "rating");
  const rating = ratingTag ? Math.min(5, Math.max(1, parseInt(ratingTag[1], 10))) : 0;

  const verifiedTag = event.tags.find(([key]) => key === "verified");
  const verified = verifiedTag?.[1] === "true";

  const aTag = event.tags.find(([key]) => key === "A" || key === "a");
  const campingRef = aTag?.[1] ?? "";

  return {
    id: event.id,
    event_id: event.id,
    camping_id: campingRef,
    author_npub: event.pubkey,
    rating,
    content: event.content,
    photos: event.tags
      .filter(([key]) => key === "imeta")
      .map((tag) => {
        const urlPart = tag.slice(1).find((p) => p.startsWith("url "));
        return urlPart?.replace("url ", "") ?? "";
      })
      .filter(Boolean),
    verified_visit: verified,
    created_at: event.created_at,
  };
}

/**
 * Fetch reviews (kind:1111) for a camping venue.
 *
 * @param venueRef — Addressable event reference: "37515:<pubkey>:<d-tag>"
 */
export function useReviews(venueRef: string | null) {
  const { ndk } = useNDK();

  return useQuery({
    queryKey: ["nostr", "reviews", venueRef],
    queryFn: async (): Promise<Review[]> => {
      if (!venueRef || !ndk) return [];

      const events = await ndk.fetchEvents({
        kinds: [NOSTR_KINDS.COMMENT],
        "#A": [venueRef],
      });

      return events
        .map(eventToReview)
        .sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!venueRef,
    staleTime: 60_000,
  });
}

interface PublishReviewParams {
  venueRef: string;
  venuePubkey: string;
  rating: number;
  content: string;
  verified?: boolean;
}

/**
 * Publish a review (kind:1111 NIP-22 comment) on a camping venue.
 */
export function usePublishReview() {
  const { ndk, currentUser } = useNDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["nostr", "review", "publish"],
    mutationFn: async ({
      venueRef,
      venuePubkey,
      rating,
      content,
      verified = false,
    }: PublishReviewParams) => {
      if (!currentUser) {
        throw new Error("Necesitás iniciar sesión para dejar una review");
      }
      if (!ndk) throw new Error("NDK no está disponible");

      const event = ndk.createEvent();
      event.kind = NOSTR_KINDS.COMMENT;
      event.content = content;

      event.tags = [
        // Root scope (uppercase) — the camping venue
        ["A", venueRef, DEFAULT_RELAY],
        ["K", String(NOSTR_KINDS.CAMPING_VENUE)],
        ["P", venuePubkey],
        // Parent scope (lowercase) — same as root for top-level review
        ["a", venueRef, DEFAULT_RELAY],
        ["k", String(NOSTR_KINDS.CAMPING_VENUE)],
        ["p", venuePubkey],
        // Rating
        ["rating", String(Math.min(5, Math.max(1, rating))), "out-of-5"],
        // Metadata
        ["t", "camping-review"],
        ...(verified ? [["verified", "true"]] : []),
      ];

      event.publish();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["nostr", "reviews", variables.venueRef],
      });
    },
  });
}
