import { Search, X } from "lucide-react-native";
import { Pressable, TextInput, useColorScheme, View } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import { useFilterStore } from "../store";

export function SearchInput() {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery);

  return (
    <GlassView
      level="ultra"
      className="mx-4 flex-row items-center rounded-glass-sm px-3 py-2"
    >
      <Search size={18} color={colors.secondary} />
      <TextInput
        className="ml-2 flex-1 font-body text-base text-[#1e2730] dark:text-[#daf0ff]"
        placeholder="Buscar campings..."
        placeholderTextColor={colors.secondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
          <View className="rounded-full bg-[#e3eaef] p-1 dark:bg-[#36424d]">
            <X size={14} color={colors.secondary} />
          </View>
        </Pressable>
      )}
    </GlassView>
  );
}
