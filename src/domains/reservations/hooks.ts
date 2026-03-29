import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/src/infrastructure/supabase/client";

import type { ReservationCreateInput } from "./types";

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReservationCreateInput) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Debés iniciar sesión para reservar.");

      const { data, error } = await supabase
        .from("reservations")
        .insert({
          camping_id: input.camping_id,
          user_id: user.id,
          check_in: input.check_in,
          check_out: input.check_out,
          guests: input.guests,
          notes: input.notes ?? null,
          status: "pending",
        })
        .select()
        .single()
        .throwOnError();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reservations", "mine"] });
    },
  });
}

export function useMyReservations() {
  return useQuery({
    queryKey: ["reservations", "mine"],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) return [];

      const { data, error } = await supabase
        .from("reservations")
        .select("*, campings(id, name, province, photos)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .throwOnError();

      if (error) throw error;
      return data ?? [];
    },
  });
}
