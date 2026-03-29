import { ShieldCheck } from "lucide-react-native";
import { Text, View, useColorScheme } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import type { NDKUserProfile } from "@/src/infrastructure/nostr/useNDK";
import type { Review } from "@/src/domains/social/types";

import { StarRating } from "./StarRating";

interface ReviewCardProps {
  review: Review;
  /** Author profile if available */
  profile?: NDKUserProfile | null;
}

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

/**
 * Card displaying a single camping review with author info,
 * star rating, content, and verified visit badge.
 */
export function ReviewCard({ review, profile }: ReviewCardProps) {
  const dark = useColorScheme() === "dark";
  const textColors = dark ? glassText.dark : glassText.light;

  const authorName =
    profile?.displayName ?? profile?.name ?? shortenPubkey(review.author_npub);

  return (
    <GlassView level="mid" className="mx-4 mb-3 rounded-glass p-4">
      {/* Header: author + time */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          <Text
            className="font-label text-sm"
            style={{ color: textColors.primary }}
            numberOfLines={1}
          >
            {authorName}
          </Text>
          {review.verified_visit && (
            <View className="flex-row items-center gap-0.5">
              <ShieldCheck size={12} color={textColors.glaciar} />
              <Text
                className="font-label text-xs"
                style={{ color: textColors.glaciar }}
              >
                Visitó
              </Text>
            </View>
          )}
        </View>
        <Text
          className="font-body text-xs"
          style={{ color: textColors.secondary }}
        >
          {formatRelativeTime(review.created_at)}
        </Text>
      </View>

      {/* Rating */}
      {review.rating > 0 && (
        <View className="mt-2">
          <StarRating value={review.rating} size={16} />
        </View>
      )}

      {/* Content */}
      {review.content.length > 0 && (
        <Text
          className="mt-2 font-body text-sm leading-5"
          style={{ color: textColors.primary }}
        >
          {review.content}
        </Text>
      )}
    </GlassView>
  );
}
