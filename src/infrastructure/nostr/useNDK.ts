/**
 * NDK Mobile hook stub.
 *
 * Once @nostr-dev-kit/mobile is installed, replace this with:
 *   export { useNDK } from "@nostr-dev-kit/mobile";
 *
 * For now, provides typed interfaces so the social domain compiles
 * and is ready for real NDK integration.
 */

export interface NDKEventData {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NDKUserProfile {
  name?: string;
  displayName?: string;
  image?: string;
  about?: string;
  lud16?: string;
  nip05?: string;
}

export interface NDKEventPublishable {
  kind: number;
  content: string;
  tags: string[][];
  publish: () => void;
}

export interface NDKInstance {
  /**
   * Create a new event ready to be published.
   * Set kind, content, tags, then call publish().
   */
  createEvent: () => NDKEventPublishable;

  /**
   * Fetch events matching a filter from relays + cache.
   */
  fetchEvents: (filter: NDKFilter) => Promise<NDKEventData[]>;

  /**
   * Fetch a single user profile by hex pubkey.
   */
  fetchProfile: (pubkey: string) => Promise<NDKUserProfile | null>;

  /** Whether NDK has connected to relays */
  connected: boolean;
}

export interface NDKFilter {
  kinds?: number[];
  authors?: string[];
  "#a"?: string[];
  "#A"?: string[];
  "#g"?: string[];
  "#t"?: string[];
  "#d"?: string[];
  since?: number;
  until?: number;
  limit?: number;
}

/**
 * Access the NDK singleton.
 *
 * Returns a stub implementation that logs warnings until NDK Mobile
 * is fully wired. All social hooks depend on this interface.
 */
export function useNDK(): { ndk: NDKInstance; currentUser: { pubkey: string } | null } {
  const stub: NDKInstance = {
    connected: false,

    createEvent: () => ({
      kind: 0,
      content: "",
      tags: [],
      publish: () => {
        console.warn("[useNDK] NDK not initialized — publish is a no-op");
      },
    }),

    fetchEvents: async () => {
      console.warn("[useNDK] NDK not initialized — fetchEvents returns []");
      return [];
    },

    fetchProfile: async () => {
      console.warn("[useNDK] NDK not initialized — fetchProfile returns null");
      return null;
    },
  };

  return { ndk: stub, currentUser: null };
}
