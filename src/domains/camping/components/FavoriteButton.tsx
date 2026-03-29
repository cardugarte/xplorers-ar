import { Heart } from "lucide-react-native";
import { Pressable, useColorScheme } from "react-native";

import { glassText } from "@/src/shared/theme/tokens";

import { useIsFavorite, useToggleFavorite } from "../useFavorites";

interface FavoriteButtonProps {
  campingId: string;
  size?: number;
}

export function FavoriteButton({ campingId, size = 22 }: FavoriteButtonProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const isFavorite = useIsFavorite(campingId);
  const { mutate: toggle, isPending } = useToggleFavorite();

  return (
    <Pressable
      onPress={() => toggle(campingId)}
      disabled={isPending}
      className="items-center justify-center p-2"
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      accessibilityState={{ selected: isFavorite }}
      hitSlop={8}
    >
      <Heart
        size={size}
        color={isFavorite ? "#ef4444" : colors.secondary}
        fill={isFavorite ? "#ef4444" : "transparent"}
      />
    </Pressable>
  );
}
