import * as Notifications from "expo-notifications";
import { router } from "expo-router";

export function setupNotificationHandlers(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as Record<
        string,
        unknown
      >;

      if (data.type === "review" && typeof data.campingId === "string") {
        router.push(`/camping/${data.campingId}`);
      } else if (
        data.type === "badge_earned" ||
        data.type === "review_reply"
      ) {
        router.push("/(tabs)/profile");
      } else if (typeof data.campingId === "string") {
        // Generic fallback: any notification with a campingId navigates to detail
        router.push(`/camping/${data.campingId}`);
      }
    }
  );

  return () => subscription.remove();
}
