import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { NOSTR_KINDS } from "@/src/infrastructure/nostr/ndk";
import { useNDK, type NDKEvent } from "@/src/infrastructure/nostr/useNDK";
import type { GPXWaypoint } from "./utils/gpx-parser";

// ─── Nostr kind for user routes ───────────────────────────────────────────────
// kind:30402 — addressable event (NIP-33), slug as `d` tag
export const ROUTE_KIND = 30402 as const;

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const RouteWaypointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  name: z.string().optional(),
  ele: z.number().optional(),
});
export type RouteWaypoint = z.infer<typeof RouteWaypointSchema>;

export const RouteContentSchema = z.object({
  waypoints: z.array(RouteWaypointSchema),
});
export type RouteContent = z.infer<typeof RouteContentSchema>;

export const UserRouteSchema = z.object({
  id: z.string(),
  pubkey: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  campingIds: z.array(z.string()),
  waypoints: z.array(RouteWaypointSchema),
  createdAt: z.number(),
});
export type UserRoute = z.infer<typeof UserRouteSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseRouteEvent(event: NDKEvent): UserRoute | null {
  try {
    const tags = event.tags;
    const getTag = (name: string) =>
      tags.find(([t]) => t === name)?.[1] ?? "";

    const slug = getTag("d");
    const name = getTag("name");
    const description = getTag("description");
    const campingIds = tags
      .filter(([t]) => t === "a")
      .map(([, ref]) => ref);

    let waypoints: RouteWaypoint[] = [];
    try {
      const parsed = JSON.parse(event.content) as unknown;
      const result = RouteContentSchema.safeParse(parsed);
      if (result.success) {
        waypoints = result.data.waypoints;
      }
    } catch {
      // content is not valid JSON — skip waypoints
    }

    return UserRouteSchema.parse({
      id: event.id ?? "",
      pubkey: event.pubkey ?? "",
      slug,
      name,
      description,
      campingIds,
      waypoints,
      createdAt: event.created_at ?? 0,
    });
  } catch {
    return null;
  }
}

// ─── Publish route mutation ───────────────────────────────────────────────────

export interface PublishRouteInput {
  name: string;
  description: string;
  campingIds: string[];
  waypoints: GPXWaypoint[];
}

export function usePublishRoute() {
  const { ndk, currentUser } = useNDK();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishRouteInput) => {
      if (!ndk) throw new Error("NDK no está disponible. Iniciá sesión primero.");
      if (!currentUser) throw new Error("Debés iniciar sesión para crear una ruta.");

      const slug = `${slugify(input.name)}-${Date.now()}`;

      const content: RouteContent = {
        waypoints: input.waypoints.map((wp) => ({
          lat: wp.lat,
          lon: wp.lon,
          ...(wp.name !== undefined && { name: wp.name }),
          ...(wp.ele !== undefined && { ele: wp.ele }),
        })),
      };

      const tags: string[][] = [
        ["d", slug],
        ["name", input.name],
        ["description", input.description],
        ["t", "camping-route"],
        ["t", "xplorers"],
        ...input.campingIds.map((id) => ["a", `${NOSTR_KINDS.CAMPING_VENUE}:${currentUser.pubkey}:${id}`]),
      ];

      const event: NDKEvent = {
        kind: ROUTE_KIND,
        content: JSON.stringify(content),
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      await ndk.publish(event);
      return { slug, event };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-routes"] });
    },
  });
}

// ─── Query user routes ────────────────────────────────────────────────────────

export function useUserRoutes(pubkey?: string) {
  const { ndk } = useNDK();

  return useQuery({
    queryKey: ["user-routes", pubkey],
    queryFn: async () => {
      if (!ndk) return [] as UserRoute[];

      const filter = {
        kinds: [ROUTE_KIND],
        ...(pubkey ? { authors: [pubkey] } : {}),
        "#t": ["camping-route"],
        limit: 50,
      };

      const events = await ndk.fetchEvents(filter);
      return events
        .map(parseRouteEvent)
        .filter((r): r is UserRoute => r !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: !!ndk,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
