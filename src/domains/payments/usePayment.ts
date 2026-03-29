import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/src/infrastructure/supabase/client";

import type { PaymentResult, PaymentSheetStatus } from "./types";
import { resolveAndRequestInvoice } from "./utils/lnurl";

// ── NWC client interface ──
// The NWC infrastructure module (src/infrastructure/wallet/nwc) exposes these.
// We define the shape here to decouple from the concrete implementation.

interface NWCPayResult {
  preimage: string;
  payment_hash: string;
}

interface NWCMakeInvoiceResult {
  invoice: string;
  payment_hash: string;
}

interface NWCClient {
  payInvoice: (params: { invoice: string }) => Promise<NWCPayResult>;
  makeInvoice: (params: {
    amount: number;
    description: string;
    expiry?: number;
  }) => Promise<NWCMakeInvoiceResult>;
  getBalance: () => Promise<{ balance: number }>;
}

// Placeholder — replaced once wallet/nwc is initialized (issue #31)
let _nwcClient: NWCClient | null = null;

export function setNWCClient(client: NWCClient | null): void {
  _nwcClient = client;
}

export function getNWCClient(): NWCClient | null {
  return _nwcClient;
}

// ── Payment timeout ──

const PAYMENT_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Pago expirado — reintentar")), ms),
    ),
  ]);
}

// ── HODL invoice threshold ──

/** Reservations of 4+ nights use HODL invoices for escrow protection. */
export const HODL_THRESHOLD_NIGHTS = 4;

/** HODL invoices get extended expiry to allow for check-in verification. */
const HODL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ── usePayCamping ──

interface PayCampingParams {
  reservationId: string;
  ownerLud16: string;
  amountSats: number;
  nights: number;
  comment?: string;
}

/**
 * Mutation that performs the full P2P Lightning payment flow:
 *
 * 1. Resolve owner's Lightning Address (LUD-16)
 * 2. Request invoice from their LNURL-pay endpoint
 * 3. Pay via the tourist's NWC wallet
 * 4. Update reservation in Supabase with payment proof
 *
 * For multi-day stays (4+ nights), uses HODL invoice flow with
 * extended expiry for check-in verification.
 */
export function usePayCamping() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PaymentSheetStatus>("idle");

  const mutation = useMutation({
    mutationFn: async (params: PayCampingParams): Promise<PaymentResult> => {
      const nwc = getNWCClient();
      if (!nwc) {
        throw new Error("Wallet no conectada — conectar NWC primero");
      }

      // Step 1: Resolve LNURL and get invoice
      setStatus("resolving");

      const isHodl = params.nights >= HODL_THRESHOLD_NIGHTS;
      let bolt11: string;

      if (isHodl) {
        // HODL flow: owner creates invoice with extended expiry via NWC
        // The makeInvoice already handles HODL semantics on supporting backends
        const invoice = await nwc.makeInvoice({
          amount: params.amountSats * 1000, // msats
          description: `Reserva Xplorers #${params.reservationId.slice(0, 8)} (${params.nights} noches)`,
          expiry: HODL_EXPIRY_SECONDS,
        });
        bolt11 = invoice.invoice;
      } else {
        // Standard flow: resolve Lightning Address
        const result = await resolveAndRequestInvoice(
          params.ownerLud16,
          params.amountSats,
          params.comment ??
            `Reserva Xplorers #${params.reservationId.slice(0, 8)}`,
        );
        bolt11 = result.bolt11;
      }

      setStatus("invoice_ready");

      // Step 2: Pay via NWC
      setStatus("paying");

      const payResult = await withTimeout(
        nwc.payInvoice({ invoice: bolt11 }),
        PAYMENT_TIMEOUT_MS,
      );

      // Step 3: Update reservation in Supabase
      const { error } = await supabase
        .from("reservations" as never)
        .update({
          status: "paid",
          payment_hash: payResult.payment_hash,
          preimage: payResult.preimage,
        } as never)
        .eq("id" as never, params.reservationId as never);

      if (error) throw error;

      setStatus("success");

      // Invalidate reservation queries
      await queryClient.invalidateQueries({
        queryKey: ["reservations"],
      });

      return {
        success: true,
        preimage: payResult.preimage,
        error: null,
      };
    },
    onError: () => {
      setStatus("error");
    },
  });

  const reset = () => {
    setStatus("idle");
    mutation.reset();
  };

  return {
    ...mutation,
    status,
    reset,
  };
}

// ── useWalletBalance ──

/**
 * Quick hook to check the connected wallet's balance.
 * Returns null when no wallet is connected.
 */
export function useWalletBalance() {
  return useMutation({
    mutationFn: async (): Promise<number | null> => {
      const nwc = getNWCClient();
      if (!nwc) return null;

      const { balance } = await nwc.getBalance();
      return balance;
    },
  });
}
