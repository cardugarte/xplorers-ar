import { MapPin, Navigation, Share2, User } from "lucide-react-native";
import { Alert, Share, Text, TouchableOpacity, View, useColorScheme } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import type { UserRoute } from "../useUserRoutes";

interface UserRouteCardProps {
  route: UserRoute;
  /** Called when the card itself is tapped — e.g. open detail view. */
  onPress?: (route: UserRoute) => void;
}

function formatDate(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function shortPubkey(pubkey: string): string {
  if (!pubkey || pubkey.length < 12) return pubkey;
  return `${pubkey.slice(0, 6)}…${pubkey.slice(-4)}`;
}

/**
 * Card component to display a user-generated camping route.
 *
 * Shows:
 *   - Route name + description
 *   - Camping count and waypoint count
 *   - Region hint (from slug, best-effort)
 *   - Author pubkey (short)
 *   - Creation date
 *   - Share button (native share sheet)
 */
export function UserRouteCard({ route, onPress }: UserRouteCardProps) {
  const dark = useColorScheme() === "dark";
  const text = glassText[dark ? "dark" : "light"];

  const campingCount = route.campingIds.length;
  const waypointCount = route.waypoints.length;

  async function handleShare() {
    try {
      await Share.share({
        title: route.name,
        message: buildShareText(route),
      });
    } catch {
      Alert.alert("Error", "No se pudo abrir el menú de compartir.");
    }
  }

  return (
    <TouchableOpacity
      onPress={() => onPress?.(route)}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <GlassView level="ultra" className="rounded-2xl p-4 mx-4 my-1.5">
        {/* Title row */}
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Navigation size={16} color={text.brand} />
              <Text
                className="font-heading text-base flex-1"
                style={{ color: text.primary }}
                numberOfLines={2}
              >
                {route.name}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShare}
            hitSlop={8}
            className="ml-2 mt-0.5"
          >
            <Share2 size={18} color={text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        {route.description.length > 0 && (
          <Text
            className="font-body text-sm mt-2 leading-5"
            style={{ color: text.secondary }}
            numberOfLines={3}
          >
            {route.description}
          </Text>
        )}

        {/* Stats row */}
        <View className="flex-row items-center gap-4 mt-3">
          {campingCount > 0 && (
            <View className="flex-row items-center gap-1">
              <MapPin size={13} color={text.brand} />
              <Text className="font-label text-xs" style={{ color: text.brand }}>
                {campingCount} {campingCount === 1 ? "camping" : "campings"}
              </Text>
            </View>
          )}

          {waypointCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Navigation size={13} color={text.glaciar} />
              <Text
                className="font-label text-xs"
                style={{ color: text.glaciar }}
              >
                {waypointCount} {waypointCount === 1 ? "waypoint" : "waypoints"}
              </Text>
            </View>
          )}
        </View>

        {/* Footer row: author + date */}
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-white/10">
          <View className="flex-row items-center gap-1">
            <User size={12} color={text.secondary} />
            <Text className="font-label text-xs" style={{ color: text.secondary }}>
              {shortPubkey(route.pubkey)}
            </Text>
          </View>
          <Text className="font-label text-xs" style={{ color: text.secondary }}>
            {formatDate(route.createdAt)}
          </Text>
        </View>
      </GlassView>
    </TouchableOpacity>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildShareText(route: UserRoute): string {
  const lines: string[] = [
    `🗺️ ${route.name}`,
  ];

  if (route.description) {
    lines.push("", route.description);
  }

  const parts: string[] = [];
  if (route.campingIds.length > 0) {
    parts.push(`${route.campingIds.length} campings`);
  }
  if (route.waypoints.length > 0) {
    parts.push(`${route.waypoints.length} waypoints`);
  }
  if (parts.length > 0) {
    lines.push("", parts.join(" · "));
  }

  lines.push("", "#xplorers #camping #ruta");
  return lines.join("\n");
}
