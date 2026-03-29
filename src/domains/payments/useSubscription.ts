import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/src/infrastructure/supabase/client";

import type {
  OwnerSubscription,
  SubscriptionPlan,
} from "./types";
import {
  OwnerSubscriptionSchema,
  SUBSCRIPTION_PRICES,
} from "./types";
import { getNWCClient } from "./usePayment";

// ── Query keys ──

const SUBSCRIPTION_KEYS = {
  all: ["subscriptions"] as const,
  byCamping: (campingId: string) =>
    ["subscriptions", "camping", campingId] as const,
  byOwner: (ownerId: string) =>
    ["subscriptions", "owner", ownerId] as const,
};

// ── useSubscription ──

/**
 * Fetch the active subscription for a specific camping.
 * Returns null when no subscription exists (free tier).
 */
export function useSubscription(campingId: string) {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.byCamping(campingId),
    queryFn: async (): Promise<OwnerSubscription | null> => {
      const { data, error } = await supabase
        .from("owner_subscriptions" as never)
        .select("*" as never)
        .eq("camping_id" as never, campingId as never)
        .in("status" as never, ["active", "past_due"] as never)
        .order("created_at" as never, { ascending: false } as never)
        .limit(1)
        .single();

      if (error) {
        // PGRST116 = no rows found — free tier
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return OwnerSubscriptionSchema.parse(data);
    },
    enabled: !!campingId,
  });
}

// ── useOwnerSubscriptions ──

/**
 * Fetch all subscriptions for the current authenticated owner.
 */
export function useOwnerSubscriptions() {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.all,
    queryFn: async (): Promise<OwnerSubscription[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data, error } = await supabase
        .from("owner_subscriptions" as never)
        .select("*" as never)
        .eq("owner_id" as never, user.id as never)
        .order("created_at" as never, { ascending: false } as never);

      if (error) throw error;

      return (data as unknown as unknown[]).map((row) =>
        OwnerSubscriptionSchema.parse(row),
      );
    },
  });
}

// ── useSubscribe ──

interface SubscribeParams {
  campingId: string;
  plan: Exclude<SubscriptionPlan, "free">;
}

/**
 * Subscribe a camping to a paid plan.
 *
 * Flow:
 * 1. Create invoice for subscription amount via NWC
 * 2. Pay the invoice
 * 3. Insert subscription record in Supabase
 */
export function useSubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubscribeParams): Promise<OwnerSubscription> => {
      const nwc = getNWCClient();
      if (!nwc) {
        throw new Error("Wallet no conectada — conectar NWC primero");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const amountSats = SUBSCRIPTION_PRICES[params.plan];

      // Create invoice for Xplorers
      const invoice = await nwc.makeInvoice({
        amount: amountSats * 1000,
        description: `Xplorers ${params.plan.toUpperCase()} — ${params.campingId.slice(0, 8)}`,
      });

      // Pay subscription
      const payResult = await nwc.payInvoice({ invoice: invoice.invoice });

      // Calculate period
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Insert subscription
      const { data, error } = await supabase
        .from("owner_subscriptions" as never)
        .insert({
          owner_id: user.id,
          camping_id: params.campingId,
          plan: params.plan,
          amount_sats: amountSats,
          payment_hash: payResult.payment_hash,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: "active",
        } as never)
        .select("*" as never)
        .single();

      if (error) throw error;

      return OwnerSubscriptionSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.all });
    },
  });
}

// ── useCancelSubscription ──

/**
 * Cancel an active subscription.
 * Sets status to 'cancelled' — the subscription remains active until expires_at.
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: string): Promise<void> => {
      const { error } = await supabase
        .from("owner_subscriptions" as never)
        .update({ status: "cancelled" } as never)
        .eq("id" as never, subscriptionId as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.all });
    },
  });
}
