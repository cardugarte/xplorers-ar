import { useEffect, useState } from "react";
import { registerForPushNotifications } from "./setup";
import { setupNotificationHandlers } from "./handlers";

interface PushNotificationsState {
  token: string | null;
}

export function usePushNotifications(): PushNotificationsState {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotifications()
      .then((pushToken) => setToken(pushToken))
      .catch((err) =>
        console.error("[notifications] Registration failed:", err)
      );

    const cleanup = setupNotificationHandlers();
    return cleanup;
  }, []);

  return { token };
}
