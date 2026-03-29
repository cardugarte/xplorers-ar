/**
 * useNDK — convenience re-export of NDK Mobile's useNDK hook and types.
 *
 * Consumers should import from this file rather than directly from
 * "@nostr-dev-kit/mobile" to keep import paths consistent and allow
 * future wrapping if needed.
 *
 * Usage:
 *   import { useNDK } from "@/src/infrastructure/nostr/useNDK";
 *   const { ndk } = useNDK();
 */
export { useNDK } from "@nostr-dev-kit/mobile";
export type { NDKUserProfile, NDKEventData, NDKEvent } from "@nostr-dev-kit/mobile";
