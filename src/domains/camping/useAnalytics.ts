import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/src/infrastructure/supabase/client";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const ViewsByDaySchema = z.object({
  date:  z.string(),  // "YYYY-MM-DD"
  count: z.number().int().nonnegative(),
});

export const CampingAnalyticsSchema = z.object({
  total_views:        z.number().int().nonnegative(),
  total_favorites:    z.number().int().nonnegative(),
  total_reservations: z.number().int().nonnegative(),
  views_by_day:       z.array(ViewsByDaySchema),
});

export type CampingAnalytics = z.infer<typeof CampingAnalyticsSchema>;
export type ViewsByDay       = z.infer<typeof ViewsByDaySchema>;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCampingAnalytics(campingId: string, days: number = 30) {
  return useQuery({
    queryKey: ["analytics", "camping", campingId, days],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "get_camping_analytics",
        { p_camping_id: campingId, p_days: days },
      );

      if (error) throw error;

      return CampingAnalyticsSchema.parse(data);
    },
    enabled: !!campingId,
    staleTime: 5 * 60 * 1000, // 5 min — analytics tolerate slight staleness
  });
}
