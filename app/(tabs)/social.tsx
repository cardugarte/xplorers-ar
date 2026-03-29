import { Rss } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { glassText } from "@/src/shared/theme/tokens";
import { useSocialFeed } from "@/src/domains/social/useFeed";
import { FeedItem } from "@/src/domains/social/components/FeedItem";
import type { FeedItem as FeedItemData } from "@/src/domains/social/useFeed";

export default function SocialScreen() {
  const dark = useColorScheme() === "dark";
  const textColors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  const { data: feedItems, isPending, refetch, isRefetching } = useSocialFeed();

  function renderItem({ item }: { item: FeedItemData }) {
    return <FeedItem item={item} />;
  }

  function keyExtractor(item: FeedItemData) {
    return item.id;
  }

  return (
    <View
      className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row items-center gap-2 px-4 pb-3 pt-2">
        <Rss size={20} color={textColors.brand} />
        <Text
          className="font-heading text-xl uppercase tracking-wide"
          style={{ color: textColors.primary }}
        >
          Feed
        </Text>
      </View>

      {/* Feed list */}
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={textColors.brand} />
        </View>
      ) : (
        <FlatList
          data={feedItems ?? []}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerClassName="pb-4"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={textColors.brand}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8 pt-20">
              <Text
                className="text-center font-body text-base"
                style={{ color: textColors.secondary }}
              >
                No hay actividad todavia. Las reviews, check-ins y notas de la
                comunidad apareceran aca.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
