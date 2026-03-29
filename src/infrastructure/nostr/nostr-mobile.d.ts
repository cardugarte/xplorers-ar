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
  export interface NDKTag extends Array<string> {
    0: string;
    1: string;
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

  export default class NDK {
    constructor(opts?: { explicitRelayUrls?: string[]; cacheAdapter?: unknown; signer?: unknown; clientName?: string });
    connect(timeout?: number): Promise<void>;
    signer?: unknown;
  }

  export interface NDKFilter {
    kinds?: number[];
    authors?: string[];
    ids?: string[];
    "#p"?: string[];
    "#d"?: string[];
    "#a"?: string[];
    "#e"?: string[];
    "#g"?: string[];
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

  export function useNDK(): { ndk: NDK | undefined };

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
