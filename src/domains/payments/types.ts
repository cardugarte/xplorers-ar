export interface NWCConnection {
  uri: string;
  pubkey: string;
  relay: string;
  secret: string;
  lud16?: string;
}

export interface LightningInvoice {
  bolt11: string;
  amount_sats: number;
  description: string;
  payment_hash: string;
  created_at: string;
  expires_at: string;
}

export interface PaymentResult {
  success: boolean;
  preimage: string | null;
  error: string | null;
}

export type ReservationStatus =
  | "pending"
  | "payment_requested"
  | "paid"
  | "confirmed"
  | "cancelled"
  | "expired";
