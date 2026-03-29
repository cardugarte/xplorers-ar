/**
 * NIP-46 remote signer hook (Nostr Connect — bunker:// protocol).
 *
 * Allows users with an existing Nostr identity to sign events without
 * exposing their nsec. Compatible with nsec.app (iOS) and Amber (Android).
 *
 * Flow:
 *   1. User pastes a bunker:// URI (or scans QR)
 *   2. useNIP46Import connects to the bunker relay
 *   3. User approves in their signing app
 *   4. NDK is configured with NDKNip46Signer — all future events are remote-signed
 *
 * Blocked by #17 (NDK install). Until then, attempting to connect returns an
 * instructive error. All types mirror @nostr-dev-kit/ndk-mobile exactly so the
 * stub swaps cleanly once NDK is installed.
 */

import { useCallback, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { z } from "zod";

// ─── Permissions requested from the remote signer ────────────────────────────

/** Nostr event kinds Xplorers needs the signer to authorize. */
const REQUESTED_PERMISSIONS = [
  "sign_event:0", // Metadata (kind:0)
  "sign_event:1", // Notes / check-ins (kind:1)
  "sign_event:7", // Reactions (kind:7)
  "sign_event:1111", // Reviews / comments (NIP-22)
  "sign_event:37515", // Camping venues (if owner)
  "sign_event:8", // Badge awards (kind:8)
  "sign_event:30008", // Profile badges (kind:30008)
] as const;

const BUNKER_RELAY = "wss://relay.nsecbunker.com";
const SECURE_STORE_KEY = "nostr-bunker-connection";

// ─── Validation ──────────────────────────────────────────────────────────────

const BunkerURISchema = z.string().refine(
  (v) =>
    v.startsWith("bunker://") &&
    v.includes("?") &&
    v.includes("relay="),
  {
    message:
      "URI inválida. Debe tener el formato: bunker://<pubkey>?relay=wss://...&secret=...",
  },
);

// Also accept raw nsec for users who don't use a remote signer
const NsecSchema = z.string().refine(
  (v) => v.startsWith("nsec1") && v.length > 10,
  { message: "nsec inválida. Debe empezar con nsec1" },
);

export type ImportMethod = "bunker" | "nsec";

// ─── Connection status ────────────────────────────────────────────────────────

export type NIP46Status =
  | "idle"
  | "connecting"
  | "waiting_approval" // bunker connected, waiting for user to approve in their app
  | "connected"
  | "error";

export interface NIP46State {
  status: NIP46Status;
  error: string | null;
  pubkey: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseNIP46ImportResult {
  state: NIP46State;
  /** Connect via bunker:// URI (NIP-46 remote signing). */
  connectBunker: (bunkerUri: string) => Promise<void>;
  /** Import via raw nsec (stored in SecureStore, local signing). */
  importNsec: (nsec: string) => Promise<void>;
  /** Cancel an in-progress connection attempt. */
  cancel: () => void;
  /** Clear error and reset to idle. */
  reset: () => void;
}

/**
 * Hook for importing an existing Nostr identity via NIP-46 bunker or nsec.
 *
 * NOTE: The NDK-powered `connectBunker` path requires @nostr-dev-kit/ndk-mobile
 * (issue #17). It throws an instructive error until NDK is installed.
 * The `importNsec` path stores the key in SecureStore and is ready to use.
 */
export function useNIP46Import(): UseNIP46ImportResult {
  const [state, setState] = useState<NIP46State>({
    status: "idle",
    error: null,
    pubkey: null,
  });

  // Abort controller — lets us cancel blockUntilReady() on timeout
  const abortRef = useRef<(() => void) | null>(null);

  const reset = useCallback(() => {
    setState({ status: "idle", error: null, pubkey: null });
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.();
    abortRef.current = null;
    setState({ status: "idle", error: null, pubkey: null });
  }, []);

  // ── bunker:// connection (NIP-46) ──────────────────────────────────────────

  const connectBunker = useCallback(async (bunkerUri: string) => {
    setState({ status: "connecting", error: null, pubkey: null });

    // Validate URI before touching NDK
    const validation = BunkerURISchema.safeParse(bunkerUri.trim());
    if (!validation.success) {
      setState({
        status: "error",
        error: validation.error.errors[0]?.message ?? "URI inválida",
        pubkey: null,
      });
      return;
    }

    // Dynamically import NDK — not available until #17 is done
    let NDK: unknown;
    let NDKNip46Signer: unknown;
    let NDKPrivateKeySigner: unknown;

    try {
      const ndkModule = await import(
        "@nostr-dev-kit/ndk-mobile" as string
      );
      NDK = (ndkModule as Record<string, unknown>).default ?? ndkModule;
      NDKNip46Signer = (ndkModule as Record<string, unknown>).NDKNip46Signer;
      NDKPrivateKeySigner = (ndkModule as Record<string, unknown>).NDKPrivateKeySigner;
    } catch {
      setState({
        status: "error",
        error:
          "NDK Mobile no está instalado. Pedile al equipo que complete la tarea #17.",
        pubkey: null,
      });
      return;
    }

    try {
      // 1. Dedicated NDK instance for bunker relay only
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const bunkerNDK = new (NDK as new (opts: unknown) => { connect(ms: number): Promise<void> })({
        explicitRelayUrls: [BUNKER_RELAY],
      });
      await bunkerNDK.connect(2000);

      // 2. Ephemeral local keypair for encrypted NIP-46 communication
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const localSigner = (NDKPrivateKeySigner as { generate(): unknown }).generate();

      setState({ status: "waiting_approval", error: null, pubkey: null });

      // 3. NIP-46 signer with permission list
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const nip46Signer = new (NDKNip46Signer as new (
        ndk: unknown,
        uri: string,
        localSigner: unknown,
        permissions?: string[],
      ) => {
        blockUntilReady(): Promise<{ hexpubkey(): string }>;
      })(bunkerNDK, bunkerUri.trim(), localSigner, [...REQUESTED_PERMISSIONS]);

      // Expose cancel
      let cancelled = false;
      abortRef.current = () => { cancelled = true; };

      // 4. Wait for user approval in their signing app (can take 30–60s)
      const remoteUser = await nip46Signer.blockUntilReady();

      if (cancelled) return;

      const pubkey = remoteUser.hexpubkey();

      // 5. Persist connection token (NOT the nsec) for auto-reconnect
      await SecureStore.setItemAsync(
        SECURE_STORE_KEY,
        JSON.stringify({ bunkerUri: bunkerUri.trim(), pubkey }),
      );

      setState({ status: "connected", error: null, pubkey });
    } catch (err) {
      setState({
        status: "error",
        error:
          err instanceof Error
            ? err.message
            : "No se pudo conectar al bunker. Verificá la URI y que tu app de firma esté abierta.",
        pubkey: null,
      });
    } finally {
      abortRef.current = null;
    }
  }, []);

  // ── nsec import (local signing) ────────────────────────────────────────────

  const importNsec = useCallback(async (nsec: string) => {
    setState({ status: "connecting", error: null, pubkey: null });

    const validation = NsecSchema.safeParse(nsec.trim());
    if (!validation.success) {
      setState({
        status: "error",
        error: validation.error.errors[0]?.message ?? "nsec inválida",
        pubkey: null,
      });
      return;
    }

    try {
      // Store nsec securely — this is the same key used by the full NDK signer
      await SecureStore.setItemAsync("nostr-nsec", nsec.trim());

      // Derive pubkey for display (requires nostr-tools, also not installed yet)
      // For now we set pubkey to null — it'll be populated after NDK init (#17)
      setState({ status: "connected", error: null, pubkey: null });
    } catch (err) {
      setState({
        status: "error",
        error:
          err instanceof Error
            ? err.message
            : "Error guardando la clave. Intentá de nuevo.",
        pubkey: null,
      });
    }
  }, []);

  return { state, connectBunker, importNsec, cancel, reset };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Reads the stored bunker connection token from SecureStore.
 * Returns null if no connection was previously saved.
 */
export async function getStoredBunkerConnection(): Promise<{
  bunkerUri: string;
  pubkey: string;
} | null> {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { bunkerUri: string; pubkey: string };
  } catch {
    return null;
  }
}

/** Clears all stored Nostr identity data from SecureStore. */
export async function clearStoredIdentity(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync("nostr-nsec"),
    SecureStore.deleteItemAsync(SECURE_STORE_KEY),
  ]);
}
