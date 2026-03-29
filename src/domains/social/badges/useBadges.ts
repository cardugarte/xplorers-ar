/**
 * Badge hooks — NIP-58 badge award and display system.
 *
 * Three main hooks:
 *   useUserBadges(npub)  — query earned badges for any user (read-only, cache-first)
 *   useAwardBadge()      — award a badge (kind:8) from the current signer
 *   useAcceptBadge()     — publish profile badges (kind:30008) to accept+display
 */

import { useMemo, useState } from "react";
import { NDKEvent, useSubscribe } from "@nostr-dev-kit/mobile";
import { nip19 } from "nostr-tools";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";

import { BADGE_DEFINITIONS, ALL_BADGE_DEFINITIONS } from "./definitions";
import type { BadgeDefinition, BadgeKey } from "./definitions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EarnedBadge {
  definition: BadgeDefinition;
  /** The kind:8 award event id (hex) */
  awardEventId: string;
  /** NIP-58 addressable ref: `30009:<xplorers-pubkey>:<d-tag>` */
  definitionRef: string;
  awardedAt: number;
}

export interface ProfileBadge {
  /** NIP-58 addressable ref: `30009:<xplorers-pubkey>:<d-tag>` */
  definitionRef: string;
  /** kind:8 award event id (hex) */
  awardEventId: string;
}

// ---------------------------------------------------------------------------
// useUserBadges — query earned badges for a user
// ---------------------------------------------------------------------------

/**
 * Subscribe to all kind:8 (BADGE_AWARD) events awarded to a user.
 * Cross-references against known BADGE_DEFINITIONS to resolve display info.
 *
 * Renders from NDK cache immediately (local-first — no loading spinners).
 * Updates reactively when relay data arrives.
 *
 * @param npub - The user's bech32 npub. Pass undefined to disable.
 */
export function useUserBadges(npub: string | undefined): {
  badges: EarnedBadge[];
  eose: boolean;
} {
  // Decode npub → hex pubkey for Nostr filters
  const hexPubkey = useMemo(() => {
    if (!npub) return undefined;
    try {
      const decoded = nip19.decode(npub);
      if (decoded.type === "npub") return decoded.data as string;
      return undefined;
    } catch {
      return undefined;
    }
  }, [npub]);

  // Subscribe to kind:8 events where p-tag = this user
  const { events: awardEvents, eose } = useSubscribe(
    hexPubkey
      ? [{ kinds: [NOSTR_KINDS.BADGE_AWARD], "#p": [hexPubkey] }]
      : false,
  );

  // Build a dTag → BadgeDefinition lookup for O(1) resolution
  const definitionsByDTag = useMemo(() => {
    const map = new Map<string, BadgeDefinition>();
    for (const def of ALL_BADGE_DEFINITIONS) {
      map.set(def.dTag, def);
    }
    return map;
  }, []);

  const badges = useMemo<EarnedBadge[]>(() => {
    if (!awardEvents.length) return [];

    const earned: EarnedBadge[] = [];

    for (const event of awardEvents) {
      // NIP-58: award event has an `a` tag referencing the badge definition
      // Format: ["a", "30009:<xplorers-pubkey>:<d-tag>", "<relay-hint>"]
      const aTag = event.tags.find((t) => t[0] === "a");
      if (!aTag) continue;

      const definitionRef = aTag[1];
      if (!definitionRef) continue;

      // Extract dTag from "30009:<pubkey>:<d-tag>"
      const parts = definitionRef.split(":");
      if (parts.length < 3 || parts[0] !== "30009") continue;

      const dTag = parts[2];
      const definition = definitionsByDTag.get(dTag);
      if (!definition) continue;

      earned.push({
        definition,
        awardEventId: event.id,
        definitionRef,
        awardedAt: event.created_at ?? 0,
      });
    }

    // Most recently awarded first
    earned.sort((a, b) => b.awardedAt - a.awardedAt);
    return earned;
  }, [awardEvents, definitionsByDTag]);

  return { badges, eose };
}

// ---------------------------------------------------------------------------
// useProfileBadges — fetch the user's curated badge display (kind:30008)
// ---------------------------------------------------------------------------

/**
 * Subscribe to the user's kind:30008 profile_badges event.
 * Returns the list of accepted badge refs the user chose to display.
 *
 * @param npub - The user's bech32 npub. Pass undefined to disable.
 */
export function useProfileBadges(npub: string | undefined): {
  profileBadges: ProfileBadge[];
  eose: boolean;
} {
  const hexPubkey = useMemo(() => {
    if (!npub) return undefined;
    try {
      const decoded = nip19.decode(npub);
      if (decoded.type === "npub") return decoded.data as string;
      return undefined;
    } catch {
      return undefined;
    }
  }, [npub]);

  const { events, eose } = useSubscribe(
    hexPubkey
      ? [
          {
            kinds: [NOSTR_KINDS.PROFILE_BADGES],
            authors: [hexPubkey],
            "#d": ["profile_badges"],
          },
        ]
      : false,
  );

  const profileBadges = useMemo<ProfileBadge[]>(() => {
    // Take the most recent kind:30008 event
    const latest = events.length
      ? [...events].sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))[0]
      : null;
    if (!latest) return [];

    const result: ProfileBadge[] = [];
    const tags = latest.tags;

    // NIP-58: `a` and `e` tags come in alternating pairs
    // ["a", "30009:<pk>:<d-tag>"] followed by ["e", "<award-event-id>"]
    for (let i = 0; i < tags.length - 1; i++) {
      if (tags[i][0] === "a" && tags[i + 1][0] === "e") {
        const definitionRef = tags[i][1];
        const awardEventId = tags[i + 1][1];
        if (definitionRef && awardEventId) {
          result.push({ definitionRef, awardEventId });
        }
        i++; // skip the `e` tag already consumed
      }
    }

    return result;
  }, [events]);

  return { profileBadges, eose };
}

// ---------------------------------------------------------------------------
// useAwardBadge — publish a kind:8 badge award
// ---------------------------------------------------------------------------

/**
 * Returns a function to award a badge to a user.
 *
 * In production this is called from a Supabase Edge Function using the
 * Xplorers app keypair. This hook is provided for admin tooling and testing.
 *
 * The award event is immutable — NIP-58 says badges cannot be revoked
 * (kind:8 is a regular event, not replaceable).
 *
 * @example
 *   const { award, isAwarding } = useAwardBadge();
 *   award({ badgeKey: "EXPLORADOR_I", recipientNpub: "npub1...", xplorersPubkey: "hex..." });
 */
export function useAwardBadge(): {
  award: (params: AwardBadgeParams) => void;
  isAwarding: boolean;
} {
  const { ndk } = useNDK();
  const [isAwarding, setIsAwarding] = useState(false);

  function award({ badgeKey, recipientNpub, xplorersPubkey }: AwardBadgeParams): void {
    if (!ndk) return;

    const definition = BADGE_DEFINITIONS[badgeKey];

    // Decode recipient npub → hex
    let recipientHex: string;
    try {
      const decoded = nip19.decode(recipientNpub);
      if (decoded.type !== "npub") return;
      recipientHex = decoded.data as string;
    } catch {
      return;
    }

    setIsAwarding(true);

    const event = new NDKEvent(ndk);
    event.kind = NOSTR_KINDS.BADGE_AWARD;
    event.content = "";
    event.tags = [
      // NIP-58: reference the badge definition
      ["a", definition.nostrRef(xplorersPubkey)],
      // NIP-58: the recipient
      ["p", recipientHex],
    ];

    // Fire and forget — NDK handles retry via cache
    event.publish().finally(() => setIsAwarding(false));
  }

  return { award, isAwarding };
}

export interface AwardBadgeParams {
  badgeKey: BadgeKey;
  recipientNpub: string;
  /** Xplorers app hex pubkey — must match the keypair used to sign */
  xplorersPubkey: string;
}

// ---------------------------------------------------------------------------
// useAcceptBadge — publish kind:30008 to accept and display badges
// ---------------------------------------------------------------------------

/**
 * Returns a function to publish a kind:30008 profile_badges event.
 * The user selects which earned badges to display on their profile.
 *
 * NIP-58: `a` and `e` tags MUST come in alternating pairs in the exact
 * order: ["a", definitionRef], ["e", awardEventId]. Breaking the order
 * prevents proper parsing by Nostr clients.
 *
 * @example
 *   const { accept } = useAcceptBadge();
 *   accept([
 *     { definitionRef: "30009:pk:explorador-i", awardEventId: "abc123" },
 *   ]);
 */
export function useAcceptBadge(): {
  accept: (badges: ProfileBadge[]) => void;
  isPublishing: boolean;
} {
  const { ndk } = useNDK();
  const [isPublishing, setIsPublishing] = useState(false);

  function accept(badges: ProfileBadge[]): void {
    if (!ndk) return;

    setIsPublishing(true);

    const event = new NDKEvent(ndk);
    event.kind = NOSTR_KINDS.PROFILE_BADGES;
    event.content = "";

    // kind:30008 is addressable — d tag identifies the profile badges slot
    event.tags = [["d", "profile_badges"]];

    // NIP-58: alternating a+e pairs (REQUIRED — order must not be broken)
    for (const badge of badges) {
      event.tags.push(
        ["a", badge.definitionRef],
        ["e", badge.awardEventId],
      );
    }

    event.publish().finally(() => setIsPublishing(false));
  }

  return { accept, isPublishing };
}

