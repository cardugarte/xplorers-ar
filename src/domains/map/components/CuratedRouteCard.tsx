import { Clock, MapPin, MountainSnow } from "lucide-react-native";
import { Pressable, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import {
  DIFFICULTY_LABELS,
  type CuratedRoute,
  type RouteDifficulty,
} from "../useRoutes";

interface CuratedRouteCardProps {
  route: CuratedRoute;
  onPress: (route: CuratedRoute) => void;
}

const DIFFICULTY_BADGE_BG: Record<RouteDifficulty, string> = {
  easy: "bg-andes-500/20 dark:bg-andes-400/20",
  moderate: "bg-crepusculo-500/20 dark:bg-crepusculo-400/20",
  hard: "bg-crepusculo-500/30 dark:bg-crepusculo-400/30",
};

const DIFFICULTY_BADGE_TEXT: Record<RouteDifficulty, string> = {
  easy: "text-andes-700 dark:text-andes-300",
  moderate: "text-crepusculo-700 dark:text-crepusculo-300",
  hard: "text-crepusculo-600 dark:text-crepusculo-400",
};

export function CuratedRouteCard({ route, onPress }: CuratedRouteCardProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  return (
    <Pressable onPress={() => onPress(route)}>
      <GlassView level="mid" className="mx-4 mb-3 rounded-glass p-4">
        {/* Name + difficulty badge */}
        <View className="flex-row items-start gap-2">
          <Text
            className="flex-1 font-heading text-lg"
            style={{ color: colors.primary }}
            numberOfLines={2}
          >
            {route.name}
          </Text>
          {route.difficulty && (
            <View
              className={`rounded-glass-xs px-2.5 py-0.5 ${DIFFICULTY_BADGE_BG[route.difficulty]}`}
            >
              <Text
                className={`font-label text-xs ${DIFFICULTY_BADGE_TEXT[route.difficulty]}`}
              >
                {DIFFICULTY_LABELS[route.difficulty]}
              </Text>
            </View>
          )}
        </View>

        {/* Region */}
        {route.region && (
          <View className="mt-1.5 flex-row items-center">
            <MapPin size={13} color={colors.secondary} />
            <Text
              className="ml-1 font-body text-sm"
              style={{ color: colors.secondary }}
            >
              {route.region}
            </Text>
          </View>
        )}

        {/* Description */}
        {route.description && (
          <Text
            className="mt-2 font-body text-sm leading-relaxed"
            style={{ color: colors.secondary }}
            numberOfLines={2}
          >
            {route.description}
          </Text>
        )}

        {/* Meta: campings count + duration */}
        <View className="mt-3 flex-row items-center gap-4">
          {route.camping_ids.length > 0 && (
            <View className="flex-row items-center gap-1">
              <MountainSnow size={13} color={colors.glaciar} />
              <Text
                className="font-label text-xs"
                style={{ color: colors.glaciar }}
              >
                {route.camping_ids.length}{" "}
                {route.camping_ids.length === 1 ? "camping" : "campings"}
              </Text>
            </View>
          )}
          {route.duration_days && (
            <View className="flex-row items-center gap-1">
              <Clock size={13} color={colors.glaciar} />
              <Text
                className="font-label text-xs"
                style={{ color: colors.glaciar }}
              >
                {route.duration_days}{" "}
                {route.duration_days === 1 ? "día" : "días"}
              </Text>
            </View>
          )}
        </View>
      </GlassView>
    </Pressable>
  );
}
