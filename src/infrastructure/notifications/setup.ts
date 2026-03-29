import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

const PROJECT_ID = "46bc471c-3824-4cfd-92be-2f173995c1f2";

// Foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Android notification channels
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  Notifications.setNotificationChannelAsync("social", {
    name: "Social",
    description: "Reviews, badges y actividad social",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[notifications] Push notification permissions not granted");
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? PROJECT_ID;

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  console.log("[notifications] Expo push token registered:", token);
  return token;
}
