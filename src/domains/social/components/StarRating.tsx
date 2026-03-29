import { Star } from "lucide-react-native";
import { Pressable, View, useColorScheme } from "react-native";

import { colors } from "@/src/shared/theme/tokens";

interface StarRatingProps {
  /** Current rating value (1-5) */
  value: number;
  /** Callback when a star is pressed. Omit for read-only display. */
  onChange?: (rating: number) => void;
  /** Star size in pixels */
  size?: number;
}

/**
 * 1-5 star rating component using lucide Star icons.
 *
 * Interactive when `onChange` is provided, read-only otherwise.
 */
export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  const dark = useColorScheme() === "dark";
  const filledColor = dark ? colors.crepusculo[400] : colors.crepusculo[500];
  const emptyColor = dark ? "#36424d" : "#e3eaef";

  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const starElement = (
          <Star
            key={star}
            size={size}
            color={filled ? filledColor : emptyColor}
            fill={filled ? filledColor : "transparent"}
          />
        );

        if (onChange) {
          return (
            <Pressable key={star} onPress={() => onChange(star)} hitSlop={4}>
              {starElement}
            </Pressable>
          );
        }

        return starElement;
      })}
    </View>
  );
}
