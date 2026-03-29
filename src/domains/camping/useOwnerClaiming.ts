import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/src/infrastructure/supabase/client";

// ─── Schemas ───────────────────────────────────────────────────────────────

export const ClaimStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const OwnerClaimSchema = z.object({
  id: z.string().uuid(),
  camping_id: z.string().uuid(),
  claimer_id: z.string().uuid(),
  status: ClaimStatusSchema,
  evidence: z.string().nullable(),
  admin_notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type OwnerClaim = z.infer<typeof OwnerClaimSchema>;

export const SubmitClaimPayloadSchema = z.object({
  campingId: z.string().uuid(),
  evidence: z.string().min(1, "Ingresá evidencia de que sos el dueño"),
});
export type SubmitClaimPayload = z.infer<typeof SubmitClaimPayloadSchema>;

// ─── Hooks ─────────────────────────────────────────────────────────────────

/** Submit a new ownership claim for a camping. */
export function useSubmitClaim() {
  return useMutation({
    mutationFn: async (payload: SubmitClaimPayload) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Tenés que estar autenticado para reclamar un camping");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("owner_claims") as any).insert({
        camping_id: payload.campingId,
        claimer_id: user.id,
        evidence: payload.evidence,
      });

      if (error) throw error;
    },
  });
}

/** Query the current user's claim status for a given camping. */
export function useClaimStatus(campingId: string) {
  return useQuery({
    queryKey: ["owner_claims", campingId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("owner_claims") as any)
        .select("*")
        .eq("camping_id", campingId)
        .eq("claimer_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return OwnerClaimSchema.parse(data);
    },
    enabled: !!campingId,
  });
}
