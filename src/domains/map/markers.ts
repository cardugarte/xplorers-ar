import { colors } from "@/src/shared/theme/tokens";

/** Marker fill color per camping type. */
export const MARKER_COLORS: Record<string, string> = {
  municipal: colors.glaciar[600],   // #0871c4
  nacional: colors.andes[500],      // #2d8653
  privado: colors.crepusculo[500],  // #f56d09
  libre: colors.andes[300],         // #83c29a
  unknown: "#8293a3",
};

/** Step thresholds for cluster circle color and radius. */
export const CLUSTER_COLOR_STEPS = [
  10,
  colors.glaciar[400],  // #3aadfa
  50,
  colors.crepusculo[400], // #ff8d2a
  200,
  colors.crepusculo[600], // #b45004
] as const;

export const CLUSTER_BASE_COLOR = colors.glaciar[600]; // #0871c4

export const CLUSTER_RADIUS_STEPS = [
  10,  25,
  50,  30,
  200, 38,
] as const;

export const CLUSTER_BASE_RADIUS = 20;
