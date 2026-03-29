/**
 * NDK access hook — wraps the NDK singleton.
 *
 * NOTE: @nostr-dev-kit/ndk-mobile is not yet installed (blocked by issue #17).
 * This file exposes a stable typed interface so identity hooks can be authored
 * ahead of the native NDK install. Replace the stub types below with real NDK
 * imports once `npm install @nostr-dev-kit/ndk-mobile nostr-tools` is run.
 *
 * Issue #17 — NDK Mobile + identity integration.
 */

// ─── Minimal type surface mirroring @nostr-dev-kit/ndk-mobile ────────────────

export interface NDKTag extends Array<string> {
  [index: number]: string;
}

export interface NDKEventShape {
  kind: number;
  content: string;
  tags: NDKTag[];
  pubkey: string;
  created_at?: number;
  id?: string;
  sig?: string;
  publish(): void;
}

export interface NDKUserProfile {
  name?: string;
  displayName?: string;
  about?: string;
  picture?: string;
  lud16?: string;
  nip05?: string;
}

export interface NDKUserShape {
  pubkey: string;
  profile?: NDKUserProfile;
  fetchProfile(): Promise<NDKUserProfile | null>;
}

export interface NDKSignerShape {
  user(): Promise<NDKUserShape>;
}

export interface NDKShape {
  signer?: NDKSignerShape;
  activeUser?: NDKUserShape;
  getUser(opts: { pubkey?: string; npub?: string }): NDKUserShape;
  publish(event: NDKEventShape): Promise<void>;
  connect(timeoutMs?: number): Promise<void>;
}

export interface NDKEventConstructor {
  new (ndk: NDKShape): NDKEventShape;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the NDK instance and whether it's ready.
 *
 * Before NDK is installed this always returns `{ ndk: null, isReady: false }`.
 * Once issue #17 lands and the singleton is wired up, replace this body with
 * the real implementation from src/infrastructure/nostr/ndk.ts.
 */
export function useNDK(): { ndk: NDKShape | null; isReady: boolean } {
  // Stub — replace with real NDK singleton access once #17 is done.
  return { ndk: null, isReady: false };
}
