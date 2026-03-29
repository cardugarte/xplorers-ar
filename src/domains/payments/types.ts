import { z } from "zod";

// ── NWC Connection ──

export interface NWCConnection {
  uri: string;
  pubkey: string;
  relay: string;
  secret: string;
  lud16?: string;
}

// ── Lightning Invoice ──

export interface LightningInvoice {
  bolt11: string;
  amount_sats: number;
  description: string;
  payment_hash: string;
  created_at: string;
  expires_at: string;
}

// ── Payment Result ──

export interface PaymentResult {
  success: boolean;
  preimage: string | null;
  error: string | null;
}

// ── Reservation Status ──

export type ReservationStatus =
  | "pending"
  | "payment_requested"
  | "paid"
  | "confirmed"
  | "cancelled"
  | "expired";

// ── Subscription Plan ──

export const SubscriptionPlanSchema = z.enum(["free", "pro", "premium"]);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

// ── Subscription Status ──

export const SubscriptionStatusSchema = z.enum([
  "active",
  "expired",
  "cancelled",
  "past_due",
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

// ── Owner Subscription ──

export const OwnerSubscriptionSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  camping_id: z.string().uuid(),
  plan: SubscriptionPlanSchema,
  amount_sats: z.number().int().nonnegative(),
  payment_hash: z.string().nullable(),
  started_at: z.string(),
  expires_at: z.string(),
  status: SubscriptionStatusSchema,
  created_at: z.string(),
});

export type OwnerSubscription = z.infer<typeof OwnerSubscriptionSchema>;

// ── Payment Sheet States ──

export type PaymentSheetStatus =
  | "idle"
  | "resolving"
  | "invoice_ready"
  | "paying"
  | "success"
  | "error";

// ── Pro Benefits ──

export const PRO_BENEFITS = {
  search_priority: true,
  analytics_dashboard: true,
  reservations_enabled: true,
  badge_pro: true,
  max_photos: 20,
} as const;

export const FREE_LIMITS = {
  max_photos: 5,
} as const;

export const SUBSCRIPTION_PRICES: Record<SubscriptionPlan, number> = {
  free: 0,
  pro: 10_000, // 10k sats/month
  premium: 25_000, // 25k sats/month
};
