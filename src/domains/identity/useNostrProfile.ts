/**
 * Nostr profile hooks (kind:0 — NIP-01 metadata).
 *
 * useNostrProfile — reads an existing Nostr profile from relays.
 * useUpdateProfile — mutation that publishes a new kind:0 event,
 *                    replacing any previous profile for that pubkey.
 *
 * Both hooks are pre-authored for when NDK lands (#17). Until then
 * `useNDK()` returns `{ ndk: null }` and the hooks short-circuit
 * gracefully (no data / isPending stays false).
 */

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useNDK } from "@/src/infrastructure/nostr/useNDK";
import type { NDKUserProfile } from "@/src/infrastructure/nostr/useNDK";
import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";
import { z } from "zod";

// ─── Zod schema (source of truth for all profile fields) ─────────────────────

export const NostrProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  about: z.string().max(300).optional(),
  picture: z.string().url().optional().or(z.literal("")),
  lud16: z
    .string()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
      message: "Lightning address inválida. Formato: usuario@dominio.com",
    })
    .optional()
    .or(z.literal("")),
  nip05: z.string().optional().or(z.literal("")),
});

export type NostrProfile = z.infer<typeof NostrProfileSchema>;

// ─── useNostrProfile ──────────────────────────────────────────────────────────

interface UseNostrProfileResult {
  profile: NDKUserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch a Nostr profile by npub or hex pubkey.
 *
 * Returns `{ profile: null, isLoading: false }` until NDK is initialised.
 * Once NDK lands, the hook fetches the kind:0 event from relays and
 * updates reactively.
 */
export function useNostrProfile(pubkeyOrNpub: string): UseNostrProfileResult {
  const { ndk, isReady } = useNDK();
  const [profile, setProfile] = useState<NDKUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!ndk || !isReady || !pubkeyOrNpub) return;

    setIsLoading(true);
    setError(null);

    try {
      const isNpub = pubkeyOrNpub.startsWith("npub1");
      const user = ndk.getUser(
        isNpub ? { npub: pubkeyOrNpub } : { pubkey: pubkeyOrNpub },
      );
      const fetched = await user.fetchProfile();
      setProfile(fetched);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al cargar perfil";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [ndk, isReady, pubkeyOrNpub]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, error, refetch: fetchProfile };
}

// ─── useUpdateProfile ─────────────────────────────────────────────────────────

interface UpdateProfileVars {
  profile: NostrProfile;
}

/**
 * Mutation that publishes a kind:0 metadata event to the relay pool,
 * replacing the user's previous profile.
 *
 * Kind:0 is a replaceable event — relays keep only the latest per pubkey.
 * Publishing is fire-and-forget; NDK retries via its internal queue.
 */
export function useUpdateProfile() {
  const { ndk, isReady } = useNDK();

  return useMutation<void, Error, UpdateProfileVars>({
    mutationFn: async ({ profile }) => {
      if (!ndk || !isReady) {
        throw new Error("NDK no está listo. Intentá de nuevo en un momento.");
      }

      // Validate before publishing
      const parsed = NostrProfileSchema.safeParse(profile);
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message ?? "Perfil inválido");
      }

      // Build the kind:0 event content — only include non-empty fields
      const content: Record<string, string> = {};
      if (parsed.data.name) content.name = parsed.data.name;
      if (parsed.data.about) content.about = parsed.data.about;
      if (parsed.data.picture) content.picture = parsed.data.picture;
      if (parsed.data.lud16) content.lud16 = parsed.data.lud16;
      if (parsed.data.nip05) content.nip05 = parsed.data.nip05;

      // Dynamically resolve NDKEvent — avoids a direct import from ndk-mobile
      // which isn't installed yet. Replace with a real import once #17 lands:
      // import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
      const { NDKEvent } = await import(
        "@nostr-dev-kit/ndk-mobile" as string
      ).catch(() => {
        throw new Error(
          "NDK Mobile no está instalado. Instalá @nostr-dev-kit/ndk-mobile.",
        );
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const event = new NDKEvent(ndk);
      event.kind = NOSTR_KINDS.METADATA;
      event.content = JSON.stringify(content);
      // publish() is fire-and-forget per NDK convention (no await)
      event.publish();
    },
  });
}
