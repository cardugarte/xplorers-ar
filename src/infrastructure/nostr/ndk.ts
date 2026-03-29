/**
 * NDK Mobile singleton — core Nostr infrastructure for Xplorers.
 *
 * Provides NDK initialization with SQLite cache, relay management,
 * and keypair generation/restoration via expo-secure-store.
 *
 * IMPORTANT: Always import from "@nostr-dev-kit/mobile", never from
 * "@nostr-dev-kit/ndk" directly — the base package lacks React Native patches.
 */
import NDK, {
  NDKPrivateKeySigner,
  type NDKSigner,
} from "@nostr-dev-kit/mobile";
import { NDKCacheAdapterSqlite } from "@nostr-dev-kit/mobile";
import * as SecureStore from "expo-secure-store";

// ---------------------------------------------------------------------------
// Relay configuration
// ---------------------------------------------------------------------------

export const RELAY_URLS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  // "wss://relay.xplorers.app" — relay propio (issue #30)
] as const;

// ---------------------------------------------------------------------------
// Nostr event kinds used by Xplorers
// ---------------------------------------------------------------------------

export const NOSTR_KINDS = {
  // NIP-01
  METADATA: 0,
  SHORT_TEXT_NOTE: 1,
  // NIP-25
  REACTION: 7,
<<<<<<< HEAD
  // NIP-58
  BADGE_AWARD: 8,
  // NIP-22
=======
  // NIP-58: badge award (regular event — immutable, cannot be revoked)
  BADGE_AWARD: 8,
>>>>>>> feat/24-badges
  COMMENT: 1111,
  // NIP-57
  ZAP_REQUEST: 9734,
  ZAP_RECEIPT: 9735,
  // NIP-32 (labels — used for reviews)
  REVIEW: 1985,
  // NIP-52 (check-ins / calendar)
  CHECK_IN: 10037,
  // NIP-58
  PROFILE_BADGES: 30008,
  BADGE_DEFINITION: 30009,
  // NIP-38
  STATUS: 30315,
  // Route / trail (addressable)
  ROUTE: 30402,
  // Custom — camping venue with geohash + amenities
  CAMPING_VENUE: 37515,
} as const;

// ---------------------------------------------------------------------------
// SecureStore keys
// ---------------------------------------------------------------------------

const NSEC_STORE_KEY = "nostr-nsec";

// ---------------------------------------------------------------------------
// NDK Singleton
// ---------------------------------------------------------------------------

let ndkInstance: NDK | null = null;

/**
 * Initialize the NDK singleton with SQLite cache and relay pool.
 * Safe to call multiple times — returns existing instance if already initialized.
 *
 * @param signer - Optional signer (e.g. from restored keypair)
 * @returns The initialized NDK instance
 */
export async function initNDK(signer?: NDKSigner): Promise<NDK> {
  if (ndkInstance) return ndkInstance;

  // SQLite cache — uses a separate DB from campingDatabase to avoid schema conflicts
  const cacheAdapter = new NDKCacheAdapterSqlite("xplorers-nostr");
  cacheAdapter.initialize();

  ndkInstance = new NDK({
    explicitRelayUrls: [...RELAY_URLS],
    cacheAdapter,
    signer,
    clientName: "xplorers",
  });

  await ndkInstance.connect(2_000); // 2s timeout per relay

  return ndkInstance;
}

/**
 * Get the existing NDK instance. Throws if not yet initialized.
 */
export function getNDK(): NDK {
  if (!ndkInstance) {
    throw new Error("NDK not initialized — call initNDK() first");
  }
  return ndkInstance;
}

/**
 * Reset the NDK instance (useful for logout/testing).
 */
export function resetNDK(): void {
  ndkInstance = null;
}

// ---------------------------------------------------------------------------
// Keypair management (SecureStore)
// ---------------------------------------------------------------------------

/**
 * Generate a new Nostr keypair and store the nsec in SecureStore.
 *
 * @returns Object with nsec (bech32) and npub (bech32)
 */
export function generateKeypair(): {
  signer: NDKPrivateKeySigner;
  nsec: string;
  npub: string;
} {
  // NDKPrivateKeySigner.generate() is SYNCHRONOUS
  const signer = NDKPrivateKeySigner.generate();
  const nsec = signer.nsec;
  const npub = signer.npub;

  // Persist nsec to secure storage
  SecureStore.setItem(NSEC_STORE_KEY, nsec);

  return { signer, nsec, npub };
}

/**
 * Restore a keypair from SecureStore.
 *
 * @returns The signer if nsec was found, null otherwise
 */
export function restoreKeypair(): NDKPrivateKeySigner | null {
  const nsec = getStoredNsec();
  if (!nsec) return null;

  // NDKPrivateKeySigner accepts nsec directly — no need to decode
  return new NDKPrivateKeySigner(nsec);
}

/**
 * Get the stored nsec from SecureStore.
 */
export function getStoredNsec(): string | null {
  return SecureStore.getItem(NSEC_STORE_KEY);
}

/**
 * Store an nsec in SecureStore (e.g. from NIP-46 import).
 */
export function storeNsec(nsec: string): void {
  SecureStore.setItem(NSEC_STORE_KEY, nsec);
}

/**
 * Delete the stored nsec from SecureStore (logout).
 */
export function deleteNsec(): void {
  SecureStore.deleteItemAsync(NSEC_STORE_KEY);
}
