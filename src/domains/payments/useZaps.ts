import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { getNWCClient, satsToMsats } from "@/src/infrastructure/wallet/nwc";

import type { PaymentResult } from "./types";

/** Preset zap amounts in sats */
export const ZAP_PRESETS = [
  { label: "21", sats: 21 },
  { label: "210", sats: 210 },
  { label: "2.1k", sats: 2_100 },
  { label: "21k", sats: 21_000 },
] as const;

interface ZapParams {
  /** Recipient's lud16 Lightning address (e.g. user@getalby.com) */
  lud16: string;
  /** Amount in satoshis */
  amountSats: number;
  /** Optional comment for the zap */
  comment?: string;
  /** Nostr event ID being zapped (for cache key invalidation) */
  eventId?: string;
}

/**
 * Resolve a Lightning address (lud16) to its LNURL-pay endpoint metadata.
 * Validates that the endpoint supports Nostr zaps.
 */
async function resolveLud16(address: string): Promise<{
  callback: string;
  minSendable: number;
  maxSendable: number;
  allowsNostr: boolean;
  nostrPubkey: string | null;
}> {
  const [name, domain] = address.split("@");
  if (!name || !domain) {
    throw new Error("Dirección Lightning inválida");
  }

  const url = `https://${domain}/.well-known/lnurlp/${name}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("No se pudo resolver la dirección Lightning");
  }

  const data = await res.json();

  return {
    callback: data.callback,
    minSendable: data.minSendable,
    maxSendable: data.maxSendable,
    allowsNostr: data.allowsNostr === true,
    nostrPubkey: data.nostrPubkey ?? null,
  };
}

/**
 * Request a BOLT11 invoice from the LNURL callback.
 */
async function requestInvoice(
  callback: string,
  amountMsats: number,
  comment?: string,
): Promise<string> {
  const url = new URL(callback);
  url.searchParams.set("amount", String(amountMsats));
  if (comment) {
    url.searchParams.set("comment", comment);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("No se pudo obtener la factura Lightning");
  }

  const data = await res.json();
  if (data.status === "ERROR") {
    throw new Error(data.reason ?? "Error al generar factura");
  }

  return data.pr as string;
}

/**
 * Mutation hook to send a zap (Lightning payment via NWC).
 *
 * Flow:
 * 1. Resolve lud16 to LNURL-pay endpoint
 * 2. Request BOLT11 invoice for the amount
 * 3. Pay invoice via NWC client
 * 4. Haptic feedback on success
 */
export function useZap() {
  const queryClient = useQueryClient();

  return useMutation<PaymentResult, Error, ZapParams>({
    mutationFn: async ({ lud16, amountSats, comment }) => {
      const client = getNWCClient();
      if (!client) {
        throw new Error("Wallet no conectada");
      }

      const amountMsats = satsToMsats(amountSats);

      // 1. Resolve lud16
      const endpoint = await resolveLud16(lud16);

      // 2. Validate amount within range
      if (amountMsats < endpoint.minSendable) {
        throw new Error(
          `Monto mínimo: ${Math.ceil(endpoint.minSendable / 1000)} sats`,
        );
      }
      if (amountMsats > endpoint.maxSendable) {
        throw new Error(
          `Monto máximo: ${Math.floor(endpoint.maxSendable / 1000)} sats`,
        );
      }

      // 3. Get BOLT11 invoice
      const bolt11 = await requestInvoice(
        endpoint.callback,
        amountMsats,
        comment,
      );

      // 4. Pay via NWC
      const { preimage } = await client.payInvoice({ invoice: bolt11 });

      return {
        success: true,
        preimage,
        error: null,
      };
    },
    onSuccess: async (_data, variables) => {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Refresh balance
      await queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });

      // Refresh zap receipts for the event if applicable
      if (variables.eventId) {
        await queryClient.invalidateQueries({
          queryKey: ["zaps", variables.eventId],
        });
      }
    },
    onError: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
}

/**
 * Query hook to check if a lud16 address is valid and supports zaps.
 */
export function useLud16Info(lud16: string | undefined) {
  return useQuery({
    queryKey: ["lnurl", lud16],
    queryFn: () => resolveLud16(lud16!),
    enabled: !!lud16,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
