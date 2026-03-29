import { useQuery } from "@tanstack/react-query";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import type { NDKEventData, NDKUserProfile } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";

/** Feed item types correspond to event kinds */
export type FeedItemType = "review" | "checkin" | "note";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  pubkey: string;
  content: string;
  created_at: number;
  tags: string[][];
  /** Rating 1-5 for reviews, null otherwise */
  rating: number | null;
  /** Camping venue ref from "a" or "A" tag */
  venueRef: string | null;
  /** Author profile — populated asynchronously */
  profile: NDKUserProfile | null;
}

function classifyEvent(event: NDKEventData): FeedItemType {
  if (event.kind === NOSTR_KINDS.COMMENT) return "review";

  const hasCheckInTag = event.tags.some(
    ([key, val]) => key === "t" && val === "checkin",
  );
  if (event.kind === NOSTR_KINDS.SHORT_TEXT_NOTE && hasCheckInTag) return "checkin";

  return "note";
}

function eventToFeedItem(
  event: NDKEventData,
  profile: NDKUserProfile | null,
): FeedItem {
  const type = classifyEvent(event);

  const ratingTag = event.tags.find(([key]) => key === "rating");
  const rating = ratingTag
    ? Math.min(5, Math.max(1, parseInt(ratingTag[1], 10)))
    : null;

  const venueTag =
    event.tags.find(([key]) => key === "A") ??
    event.tags.find(([key]) => key === "a");

  return {
    id: event.id,
    type,
    pubkey: event.pubkey,
    content: event.content,
    created_at: event.created_at,
    tags: event.tags,
    rating,
    venueRef: venueTag?.[1] ?? null,
    profile,
  };
}

/**
 * Fetch the social feed: reviews (1111), check-ins and notes (1) with camping tags.
 *
 * @param geohashPrefix — Optional geohash prefix for geographic filtering (precision 3-4)
 */
export function useSocialFeed(geohashPrefix?: string) {
  const { ndk } = useNDK();

  return useQuery({
    queryKey: ["nostr", "feed", geohashPrefix ?? "global"],
    queryFn: async (): Promise<FeedItem[]> => {
      // Build filter: camping-related events
      const baseFilter = {
        kinds: [NOSTR_KINDS.COMMENT, NOSTR_KINDS.SHORT_TEXT_NOTE],
        "#t": ["camping"],
        limit: 50,
        ...(geohashPrefix ? { "#g": [geohashPrefix] } : {}),
      };

      const events = await ndk.fetchEvents(baseFilter);

      // Collect unique pubkeys for profile fetching
      const pubkeys = [...new Set(events.map((e) => e.pubkey))];
      const profiles = new Map<string, NDKUserProfile | null>();

      // Fetch profiles in parallel (best effort — don't block feed)
      await Promise.allSettled(
        pubkeys.map(async (pk) => {
          const profile = await ndk.fetchProfile(pk);
          profiles.set(pk, profile);
        }),
      );

      return events
        .map((e) => eventToFeedItem(e, profiles.get(e.pubkey) ?? null))
        .sort((a, b) => b.created_at - a.created_at);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
