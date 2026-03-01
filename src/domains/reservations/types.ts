import { z } from "zod";

import type { ReservationStatus } from "@/src/domains/payments/types";

export const ReservationSchema = z.object({
  id: z.string().uuid(),
  camping_id: z.string().uuid(),
  camper_npub: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  guests: z.number().int().positive(),
  notes: z.string().optional(),
  total_sats: z.number().int().positive(),
  status: z.enum([
    "pending",
    "payment_requested",
    "paid",
    "confirmed",
    "cancelled",
    "expired",
  ]),
  payment_hash: z.string().nullable(),
  preimage: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Reservation = z.infer<typeof ReservationSchema>;

export interface ReservationCreateInput {
  camping_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  notes?: string;
}
