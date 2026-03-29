import { Minus, Plus, Users } from "lucide-react-native";
import { Pressable, Text, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

interface GuestCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function GuestCounter({
  value,
  onChange,
  min = 1,
  max = 20,
}: GuestCounterProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const borderColor = dark ? "#36424d" : "#e3eaef";

  return (
    <GlassView
      level="soft"
      className="rounded-glass-sm p-3"
      style={{ borderWidth: 1, borderColor }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Users size={16} color={colors.brand} />
          <View>
            <Text className="font-label text-xs" style={{ color: colors.secondary }}>
              Personas
            </Text>
            <Text className="font-body text-sm" style={{ color: colors.primary }}>
              {value} {value === 1 ? "persona" : "personas"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={decrement}
            disabled={value <= min}
            hitSlop={8}
            className="rounded-full items-center justify-center"
            style={{
              width: 32,
              height: 32,
              backgroundColor: dark ? "#36424d" : "#e3eaef",
              opacity: value <= min ? 0.4 : 1,
            }}
          >
            <Minus size={16} color={colors.primary} />
          </Pressable>

          <Text
            className="font-heading text-lg w-8 text-center"
            style={{ color: colors.primary }}
          >
            {value}
          </Text>

          <Pressable
            onPress={increment}
            disabled={value >= max}
            hitSlop={8}
            className="rounded-full items-center justify-center"
            style={{
              width: 32,
              height: 32,
              backgroundColor: dark ? "#36424d" : "#e3eaef",
              opacity: value >= max ? 0.4 : 1,
            }}
          >
            <Plus size={16} color={colors.primary} />
          </Pressable>
        </View>
      </View>
    </GlassView>
  );
}
