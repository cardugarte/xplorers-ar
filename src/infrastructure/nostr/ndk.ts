// NDK Mobile singleton — initialized in Fase 2 (issue #17)
// This file is a placeholder for the NDK Mobile integration.
//
// Will configure:
// - NDK singleton with relay pool (propio + públicos)
// - SQLite cache adapter via @nostr-dev-kit/ndk-mobile
// - Outbox model for optimal relay routing
//
// Relays:
// - wss://relay.xplorers.app (propio — Strfry)
// - wss://relay.damus.io
// - wss://nos.lol
// - wss://relay.nostr.band

export const RELAY_URLS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
] as const;

// Nostr event kinds used by Xplorers
export const NOSTR_KINDS = {
  METADATA: 0,
  SHORT_TEXT_NOTE: 1,
  REACTION: 7,
  COMMENT: 1111,
  ZAP_RECEIPT: 9735,
  PROFILE_BADGES: 30008,
  BADGE_DEFINITION: 30009,
  STATUS: 30315,
  CAMPING_VENUE: 37515,
} as const;
