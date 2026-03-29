// Stub hook for NDK integration — real implementation in Fase 2 (#17)
// This provides a type-safe interface that will be replaced when
// @nostr-dev-kit/ndk-mobile is installed and configured.

export interface NDKEvent {
  kind: number;
  content: string;
  tags: string[][];
  created_at?: number;
  id?: string;
  pubkey?: string;
}

export interface NDK {
  publish: (event: NDKEvent) => Promise<void>;
  fetchEvents: (filter: NDKFilter) => Promise<NDKEvent[]>;
}

export interface NDKFilter {
  kinds?: number[];
  authors?: string[];
  "#t"?: string[];
  "#d"?: string[];
  limit?: number;
}

export interface NDKHookResult {
  ndk: NDK | null;
  currentUser: { pubkey: string } | null;
}

/**
 * Stub hook — returns null until NDK Mobile is wired up in Fase 2.
 * Replace this with the real useNDK() from @nostr-dev-kit/ndk-mobile.
 */
export function useNDK(): NDKHookResult {
  return {
    ndk: null,
    currentUser: null,
  };
}
