import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/src/infrastructure/supabase/client";

// ─── Lightning Address validation ────────────────────────────────────────────

export interface LightningAddressInfo {
  valid: boolean;
  allowsNostr: boolean;
  nostrPubkey: string | null;
  minSendable: number;
  maxSendable: number;
}

export async function validateLightningAddress(
  lud16: string,
): Promise<LightningAddressInfo> {
  const empty: LightningAddressInfo = {
    valid: false,
    allowsNostr: false,
    nostrPubkey: null,
    minSendable: 0,
    maxSendable: 0,
  };

  const parts = lud16.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return empty;
  const [user, domain] = parts;

  try {
    const res = await fetch(`https://${domain}/.well-known/lnurlp/${user}`);
    if (!res.ok) return empty;

    const data = (await res.json()) as {
      status?: string;
      callback?: string;
      allowsNostr?: boolean;
      nostrPubkey?: string;
      minSendable?: number;
      maxSendable?: number;
    };

    return {
      valid: data.status !== "ERROR" && !!data.callback,
      allowsNostr: !!data.allowsNostr,
      nostrPubkey: data.nostrPubkey ?? null,
      minSendable: data.minSendable ?? 0,
      maxSendable: data.maxSendable ?? 0,
    };
  } catch {
    return empty;
  }
}

// ─── Mutation hook ────────────────────────────────────────────────────────────

export interface SetLightningAddressPayload {
  campingId: string;
  lud16: string;
}

export interface SetLightningAddressResult {
  lud16: string;
  allowsNostr: boolean;
  nostrPubkey: string | null;
}

export function useSetLightningAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campingId,
      lud16,
    }: SetLightningAddressPayload): Promise<SetLightningAddressResult> => {
      const trimmed = lud16.trim().toLowerCase();

      const info = await validateLightningAddress(trimmed);
      if (!info.valid) {
        throw new Error("La Lightning Address no es válida o no responde.");
      }

      // Call the RPC that enforces owner_npub is set
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)(
        "set_owner_lightning_address",
        { camping_id: campingId, lud16: trimmed },
      );

      if (error) throw error;

      return {
        lud16: trimmed,
        allowsNostr: info.allowsNostr,
        nostrPubkey: info.nostrPubkey,
      };
    },
    onSuccess: (_data, { campingId }) => {
      // Invalidate the camping detail so owner_lightning_address refreshes
      void queryClient.invalidateQueries({ queryKey: ["campings", campingId] });
    },
  });
}
