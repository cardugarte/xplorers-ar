import { MapPin, MessageSquare, Star } from "lucide-react-native";
import { Text, View, useColorScheme } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText, colors } from "@/src/shared/theme/tokens";
import type { FeedItem as FeedItemData } from "@/src/domains/social/useFeed";

import { StarRating } from "./StarRating";

function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return new Date(timestamp * 1000).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

function shortenPubkey(hex: string): string {
  if (hex.length < 12) return hex;
  return `${hex.slice(0, 8)}...${hex.slice(-4)}`;
}

/** Icon + accent color for each feed item type */
function typeIndicator(type: FeedItemData["type"], dark: boolean) {
  switch (type) {
    case "review":
      return {
        icon: <MessageSquare size={14} color={dark ? colors.crepusculo[400] : colors.crepusculo[500]} />,
        label: "Review",
        color: dark ? colors.crepusculo[400] : colors.crepusculo[500],
      };
    case "checkin":
      return {
        icon: <MapPin size={14} color={dark ? colors.andes[400] : colors.andes[600]} />,
        label: "Check-in",
        color: dark ? colors.andes[400] : colors.andes[600],
      };
    case "note":
      return {
        icon: <Star size={14} color={dark ? colors.glaciar[400] : colors.glaciar[600]} />,
        label: "Nota",
        color: dark ? colors.glaciar[400] : colors.glaciar[600],
      };
  }
}

interface FeedItemProps {
  item: FeedItemData;
}

/**
 * Renders a single feed item — review, check-in, or note.
 * Adapts its appearance based on the event type.
 */
export function FeedItem({ item }: FeedItemProps) {
  const dark = useColorScheme() === "dark";
  const textColors = dark ? glassText.dark : glassText.light;
  const indicator = typeIndicator(item.type, dark);

  const authorName =
    item.profile?.displayName ?? item.profile?.name ?? shortenPubkey(item.pubkey);

  return (
    <GlassView level="mid" className="mx-4 mb-3 rounded-glass p-4">
      {/* Header: type badge + author + time */}
      <View className="flex-row items-center gap-2">
        {/* Type indicator */}
        <View
          className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
          style={{
            backgroundColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          }}
        >
          {indicator.icon}
          <Text
            className="font-label text-xs"
            style={{ color: indicator.color }}
          >
            {indicator.label}
          </Text>
        </View>

        {/* Author */}
        <Text
          className="flex-1 font-label text-sm"
          style={{ color: textColors.primary }}
          numberOfLines={1}
        >
          {authorName}
        </Text>

        {/* Timestamp */}
        <Text
          className="font-body text-xs"
          style={{ color: textColors.secondary }}
        >
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>

      {/* Rating (reviews only) */}
      {item.type === "review" && item.rating != null && item.rating > 0 && (
        <View className="mt-2">
          <StarRating value={item.rating} size={14} />
        </View>
      )}

      {/* Content */}
      {item.content.length > 0 && (
        <Text
          className="mt-2 font-body text-sm leading-5"
          style={{ color: textColors.primary }}
          numberOfLines={6}
        >
          {item.content}
        </Text>
      )}
    </GlassView>
  );
}
