import { View, Text } from "react-native";

export default function SocialScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
      <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
        Social
      </Text>
      <Text className="mt-2 text-sm text-neutral-500">
        Feed Nostr — Fase 2
      </Text>
    </View>
  );
}
