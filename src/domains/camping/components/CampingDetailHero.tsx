import { Image } from "expo-image";
import { Mountain } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

interface CampingDetailHeroProps {
  photos: string[];
}

export function CampingDetailHero({ photos }: CampingDetailHeroProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <GlassView level="soft" className="h-60 items-center justify-center">
        <Mountain size={64} color={colors.secondary} />
        <Text
          className="mt-3 font-body text-sm"
          style={{ color: colors.secondary }}
        >
          Sin fotos disponibles
        </Text>
      </GlassView>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
      >
        {photos.map((uri, i) => (
          <Image
            key={uri}
            source={{ uri }}
            contentFit="cover"
            style={{ width, height: 280 }}
            alt={`Foto ${i + 1}`}
          />
        ))}
      </ScrollView>
      {photos.length > 1 && (
        <View className="absolute bottom-3 flex-row self-center gap-1.5">
          {photos.map((uri, i) => (
            <View
              key={uri}
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  i === activeIndex
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
