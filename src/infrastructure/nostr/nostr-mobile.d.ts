/**
 * Type stubs for @nostr-dev-kit/mobile and nostr-tools.
 *
 * These are minimal declarations to allow `tsc --noEmit` to pass on the main
 * branch where the packages are not yet installed.
 *
 * These stubs will be replaced by the real package types once
 * @nostr-dev-kit/mobile is installed (tracked in feat/17-ndk-mobile).
 *
 * DO NOT expand these stubs — keep them minimal. Real types live in the package.
 */

declare module "@nostr-dev-kit/mobile" {
  /** A tag is simply an array of strings, e.g. ["p", "<hex>"] */
  export type NDKTag = string[];

  /** Profile metadata from kind:0 events (NIP-01). */
  export interface NDKUserProfile {
    name?: string;
    displayName?: string;
    about?: string;
    picture?: string;
    banner?: string;
    lud16?: string;
    nip05?: string;
    [key: string]: unknown;
  }

  /** Serialised event data (used by hooks before full NDKEvent hydration). */
  export interface NDKEventData {
    id: string;
    pubkey: string;
    kind: number;
    content: string;
    tags: string[][];
    created_at: number;
  }

  export interface NDKUser {
    pubkey: string;
    npub: string;
    fetchProfile(): Promise<NDKUserProfile | null>;
  }

  export class NDKEvent {
    constructor(ndk?: NDK);
    id: string;
    pubkey: string;
    kind: number;
    content: string;
    tags: NDKTag[];
    created_at: number | undefined;
    publish(): Promise<void>;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface NDKSigner {}

  export class NDKCacheAdapterSqlite {
    constructor(dbName: string);
    initialize(): void;
  }

  export class NDKSessionExpoSecureStore {
    constructor();
  }

  export default class NDK {
    constructor(opts?: { explicitRelayUrls?: string[]; cacheAdapter?: unknown; signer?: unknown; clientName?: string });
    connect(timeout?: number): Promise<void>;
    connected: boolean;
    signer?: unknown;
    getUser(opts: { npub?: string; pubkey?: string }): NDKUser;
    createEvent(): NDKEvent;
    publish(event: NDKEvent | NDKEventData): Promise<void>;
    fetchEvents(filter: NDKFilter | Record<string, unknown>): Promise<NDKEventData[]>;
    fetchProfile(pubkey: string): Promise<NDKUserProfile | null>;
  }

  export interface NDKFilter {
    kinds?: number[];
    authors?: string[];
    ids?: string[];
    "#p"?: string[];
    "#d"?: string[];
    "#a"?: string[];
    "#A"?: string[];
    "#e"?: string[];
    "#g"?: string[];
    "#t"?: string[];
    since?: number;
    until?: number;
    limit?: number;
  }

  export interface NDKSubscribeOptions {
    closeOnEose?: boolean;
    cacheUsage?: string;
  }

  export function useSubscribe(
    filters: NDKFilter[] | false,
    opts?: NDKSubscribeOptions,
    deps?: unknown[],
  ): { events: NDKEvent[]; eose: boolean };

  export function useNDK(): {
    ndk: NDK | undefined;
    currentUser: NDKUser | undefined;
    isReady: boolean;
  };

  export function useNDKInit(): (ndk: NDK) => void;

  export function useSessionMonitor(opts?: {
    profile?: boolean;
    follows?: boolean;
  }): void;

  export class NDKPrivateKeySigner {
    static generate(): NDKPrivateKeySigner;
    constructor(nsec: string);
    readonly nsec: string;
    readonly npub: string;
  }
}

declare module "nostr-tools" {
  export interface DecodedNpub {
    type: "npub";
    data: string;
  }

  export interface DecodedNsec {
    type: "nsec";
    data: Uint8Array;
  }

  export interface DecodedNprofile {
    type: "nprofile";
    data: { pubkey: string; relays?: string[] };
  }

  export type Decoded =
    | DecodedNpub
    | DecodedNsec
    | DecodedNprofile
    | { type: string; data: unknown };

  export namespace nip19 {
    function decode(bech32: string): Decoded;
    function npubEncode(hex: string): string;
    function nsecEncode(bytes: Uint8Array): string;
  }
}
