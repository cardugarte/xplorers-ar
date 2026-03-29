/**
 * NIP-58 Badge Definitions for Xplorers
 *
 * These are the canonical badge definitions published as kind:30009 events
 * from the Xplorers app keypair. Source of truth aligned with BADGES in types.ts.
 *
 * kind:30009 is addressable (30000-39999 range) — identified by
 * `30009:<xplorers-pubkey>:<d-tag>`. Publishing a new event with the same
 * kind+pubkey+dTag replaces the old one.
 */

import { BADGES } from "@/src/domains/social/types";

// ---------------------------------------------------------------------------
// Badge criteria types
// ---------------------------------------------------------------------------

const BADGE_CRITERIA_TYPE = {
  CHECKIN_COUNT: "checkin_count",
  REVIEW_COUNT: "review_count",
  PATAGONIA_PROVINCES: "patagonia_provinces",
  EARLY_USER: "early_user",
} as const;

type BadgeCriteriaType = (typeof BADGE_CRITERIA_TYPE)[keyof typeof BADGE_CRITERIA_TYPE];

export interface BadgeCriteria {
  type: BadgeCriteriaType;
  threshold: number;
}

// ---------------------------------------------------------------------------
// Badge definition shape
// ---------------------------------------------------------------------------

export interface BadgeDefinition {
  /** NIP-58 d-tag — unique identifier for the badge under the Xplorers pubkey */
  dTag: string;
  name: string;
  description: string;
  /** Emoji used as visual representation until graphic assets are ready */
  emoji: string;
  /** Criteria evaluated by the Edge Function to auto-award this badge */
  criteria: BadgeCriteria;
  /**
   * NIP-58 kind:30009 addressable reference string.
   * Requires XPLORERS_PUBKEY to be filled once the app keypair is generated.
   * Format: `30009:<xplorers-hex-pubkey>:<d-tag>`
   */
  nostrRef: (xplorersPubkey: string) => string;
}

// ---------------------------------------------------------------------------
// Patagonian provinces — used by the PATAGONICO badge criteria
// ---------------------------------------------------------------------------

export const PATAGONIA_PROVINCES = [
  "Neuquén",
  "Río Negro",
  "Chubut",
  "Santa Cruz",
  "Tierra del Fuego",
] as const;

export type PatagoniaProvince = (typeof PATAGONIA_PROVINCES)[number];

// ---------------------------------------------------------------------------
// Badge definitions — sourced from BADGES const in types.ts
// ---------------------------------------------------------------------------

export const BADGE_DEFINITIONS = {
  EXPLORADOR_I: {
    dTag: BADGES.EXPLORADOR_I.d_tag,
    name: BADGES.EXPLORADOR_I.name,
    description: BADGES.EXPLORADOR_I.description,
    emoji: "🧭",
    criteria: {
      type: BADGE_CRITERIA_TYPE.CHECKIN_COUNT,
      threshold: 3,
    },
    nostrRef: (xplorersPubkey: string) =>
      `30009:${xplorersPubkey}:${BADGES.EXPLORADOR_I.d_tag}`,
  },

  EXPLORADOR_II: {
    dTag: BADGES.EXPLORADOR_II.d_tag,
    name: BADGES.EXPLORADOR_II.name,
    description: BADGES.EXPLORADOR_II.description,
    emoji: "🗺️",
    criteria: {
      type: BADGE_CRITERIA_TYPE.CHECKIN_COUNT,
      threshold: 10,
    },
    nostrRef: (xplorersPubkey: string) =>
      `30009:${xplorersPubkey}:${BADGES.EXPLORADOR_II.d_tag}`,
  },

  PATAGONICO: {
    dTag: BADGES.PATAGONICO.d_tag,
    name: BADGES.PATAGONICO.name,
    description: BADGES.PATAGONICO.description,
    emoji: "🏔️",
    criteria: {
      type: BADGE_CRITERIA_TYPE.PATAGONIA_PROVINCES,
      threshold: 3,
    },
    nostrRef: (xplorersPubkey: string) =>
      `30009:${xplorersPubkey}:${BADGES.PATAGONICO.d_tag}`,
  },

  CRITICO_DEL_FOGON: {
    dTag: BADGES.CRITICO_DEL_FOGON.d_tag,
    name: BADGES.CRITICO_DEL_FOGON.name,
    description: BADGES.CRITICO_DEL_FOGON.description,
    emoji: "🔥",
    criteria: {
      type: BADGE_CRITERIA_TYPE.REVIEW_COUNT,
      threshold: 5,
    },
    nostrRef: (xplorersPubkey: string) =>
      `30009:${xplorersPubkey}:${BADGES.CRITICO_DEL_FOGON.d_tag}`,
  },

  PIONERO: {
    dTag: BADGES.PIONERO.d_tag,
    name: BADGES.PIONERO.name,
    description: BADGES.PIONERO.description,
    emoji: "⭐",
    criteria: {
      type: BADGE_CRITERIA_TYPE.EARLY_USER,
      threshold: 100,
    },
    nostrRef: (xplorersPubkey: string) =>
      `30009:${xplorersPubkey}:${BADGES.PIONERO.d_tag}`,
  },
} as const satisfies Record<keyof typeof BADGES, BadgeDefinition>;

export type BadgeKey = keyof typeof BADGE_DEFINITIONS;

/** Ordered list of all badge definitions for iteration */
export const ALL_BADGE_DEFINITIONS: BadgeDefinition[] = Object.values(BADGE_DEFINITIONS);
