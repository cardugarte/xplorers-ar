// GPX parser — no external dependencies, pure string parsing.
// Handles <trkpt> (track points) and <wpt> (standalone waypoints).

import { z } from "zod";

export const GPXWaypointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  name: z.string().optional(),
  ele: z.number().optional(),
});

export type GPXWaypoint = z.infer<typeof GPXWaypointSchema>;

export const GPXParseResultSchema = z.object({
  waypoints: z.array(GPXWaypointSchema),
  trackName: z.string().optional(),
  error: z.string().optional(),
});

export type GPXParseResult = z.infer<typeof GPXParseResultSchema>;

function extractText(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`));
  return match?.[1]?.trim();
}

/**
 * Parse a GPX XML string into an array of waypoints.
 *
 * Supported elements:
 *   - <trkpt lat="..." lon="..."> — track points inside <trkseg>
 *   - <wpt lat="..." lon="...">   — standalone waypoints
 *
 * Returns waypoints in order: track points first, then standalone wpts.
 */
export function parseGPX(xml: string): GPXParseResult {
  const waypoints: GPXWaypoint[] = [];

  if (!xml || !xml.includes("<gpx")) {
    return { waypoints: [], error: "El archivo no es un GPX válido." };
  }

  // Parse track name
  const trackName = extractText(xml, "name");

  // Match <trkpt lat="..." lon="...">...</trkpt>
  // Using dotAll-style workaround with [\s\S]*? for React Native compat
  const trkptRegex =
    /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;

  let match: RegExpExecArray | null;

  while ((match = trkptRegex.exec(xml)) !== null) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    const inner = match[3];

    if (isNaN(lat) || isNaN(lon)) continue;

    const name = extractText(inner, "name");
    const eleRaw = extractText(inner, "ele");
    const ele = eleRaw !== undefined ? parseFloat(eleRaw) : undefined;

    waypoints.push({
      lat,
      lon,
      ...(name !== undefined && { name }),
      ...(ele !== undefined && !isNaN(ele) && { ele }),
    });
  }

  // Match <wpt lat="..." lon="...">...</wpt>
  const wptRegex =
    /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/wpt>/g;

  while ((match = wptRegex.exec(xml)) !== null) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    const inner = match[3];

    if (isNaN(lat) || isNaN(lon)) continue;

    const name = extractText(inner, "name");

    waypoints.push({
      lat,
      lon,
      ...(name !== undefined && { name }),
    });
  }

  return {
    waypoints,
    ...(trackName !== undefined && { trackName }),
  };
}
