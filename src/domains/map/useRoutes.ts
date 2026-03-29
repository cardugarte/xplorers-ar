import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/src/infrastructure/supabase/client";
import type { Camping } from "@/src/domains/camping/types";

// ─── Schemas ───────────────────────────────────────────────────────────────

export const RouteDifficultySchema = z.enum(["easy", "moderate", "hard"]);
export type RouteDifficulty = z.infer<typeof RouteDifficultySchema>;

export const CuratedRouteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  region: z.string().nullable(),
  difficulty: RouteDifficultySchema.nullable(),
  duration_days: z.number().int().positive().nullable(),
  camping_ids: z.array(z.string().uuid()),
  waypoints: z.record(z.unknown()).nullable(),
  created_at: z.string(),
});
export type CuratedRoute = z.infer<typeof CuratedRouteSchema>;

export const RouteWithCampingsSchema = z.object({
  route: CuratedRouteSchema,
  campings: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      province: z.string(),
    }),
  ),
});
export type RouteWithCampings = z.infer<typeof RouteWithCampingsSchema>;

// ─── Hooks ─────────────────────────────────────────────────────────────────

/** Fetch all curated routes, ordered by name. */
export function useCuratedRoutes() {
  return useQuery({
    queryKey: ["curated_routes"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("curated_routes") as any)
        .select("*")
        .order("name");

      if (error) throw error;
      return z.array(CuratedRouteSchema).parse(data);
    },
  });
}

/** Fetch a single route with its associated campings (ordered by position). */
export function useRouteWithCampings(routeId: string) {
  return useQuery({
    queryKey: ["curated_routes", routeId, "with_campings"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        "get_route_with_campings",
        { route_id: routeId },
      );

      if (error) throw error;
      return RouteWithCampingsSchema.parse(data);
    },
    enabled: !!routeId,
  });
}

// ─── Labels ────────────────────────────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<RouteDifficulty, string> = {
  easy: "Fácil",
  moderate: "Moderada",
  hard: "Difícil",
};

export const DIFFICULTY_COLORS: Record<RouteDifficulty, string> = {
  easy: "text-andes-600 dark:text-andes-400",
  moderate: "text-crepusculo-600 dark:text-crepusculo-400",
  hard: "text-crepusculo-500",
};
