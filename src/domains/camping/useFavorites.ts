import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/src/infrastructure/supabase/client";

import {
  getLocalFavorites,
  toggleLocalFavorite,
} from "./favorites";

const FAVORITES_QUERY_KEY = ["favorites"] as const;

// ---------------------------------------------------------------------------
// useFavorites — query local MMKV favorites list
// ---------------------------------------------------------------------------
export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: () => getLocalFavorites(),
    staleTime: Infinity, // local data — never stale
  });
}

// ---------------------------------------------------------------------------
// useIsFavorite — derived boolean for a single camping id
// ---------------------------------------------------------------------------
export function useIsFavorite(campingId: string): boolean {
  const { data: favorites = [] } = useFavorites();
  return favorites.includes(campingId);
}

// ---------------------------------------------------------------------------
// Supabase sync helpers (only for authenticated non-anonymous users)
// ---------------------------------------------------------------------------
async function syncAddToSupabase(campingId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("favorites") as any).upsert(
    { camping_id: campingId },
    { onConflict: "user_id,camping_id" },
  );
  if (error) throw error;
}

async function syncRemoveFromSupabase(campingId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("favorites") as any)
    .delete()
    .eq("camping_id", campingId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// useToggleFavorite — optimistic mutation with haptic feedback + Supabase sync
// ---------------------------------------------------------------------------
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["favorites", "toggle"],
    mutationFn: async (campingId: string): Promise<boolean> => {
      // 1. Toggle local storage and get the new state
      const added = toggleLocalFavorite(campingId);

      // 2. Sync to Supabase only for authenticated (non-anonymous) users
      const { data: { session } } = await supabase.auth.getSession();
      const anonymous =
        !session ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user.user_metadata as any)?.is_anonymous === true ||
        session.user.is_anonymous === true;

      if (!anonymous) {
        if (added) {
          await syncAddToSupabase(campingId);
        } else {
          await syncRemoveFromSupabase(campingId);
        }
      }

      return added;
    },
    onMutate: async (campingId: string) => {
      // Haptic feedback fires immediately before any async work
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });

      // Snapshot the previous value for rollback on error
      const previous = queryClient.getQueryData<string[]>(FAVORITES_QUERY_KEY);

      // Optimistically update the cache
      queryClient.setQueryData<string[]>(FAVORITES_QUERY_KEY, (old = []) =>
        old.includes(campingId)
          ? old.filter((id) => id !== campingId)
          : [...old, campingId],
      );

      return { previous };
    },
    onError: (_err, _campingId, context) => {
      // Roll back to the pre-mutation snapshot
      if (context?.previous !== undefined) {
        queryClient.setQueryData(FAVORITES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      // Always refetch after success or error to stay in sync with local storage
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}
