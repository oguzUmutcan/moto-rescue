import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef } from "react";

import "@/global.css";
import { RegistrationProvider } from "@/contexts/registration";
import { auth } from "@/config/firebase";
import { userApi } from "@/api/users";
import { addNotificationResponseListener, registerPushNotifications, unregisterPushNotifications } from "@/utils/push-notifications";
import { notificationRoute, profileRoute } from "@/utils/app-routing";

export default function RootLayout() {
  const router = useRouter();
  const lastNotificationNavigation = useRef<{ key: string; handledAt: number } | null>(null);
  const notificationNavigationHandled = useRef(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      userApi.get()
        .then(async (profile) => {
          if (profile.notificationsEnabled) {
            await registerPushNotifications();
          } else {
            await unregisterPushNotifications();
          }
          if (!notificationNavigationHandled.current) {
            router.replace(profileRoute(profile));
          }
        })
        .catch((error) => {
          console.warn("Could not sync push notifications", error);
        });
    });

    const subscription = addNotificationResponseListener((data) => {
      const destination = notificationRoute(data);
      if (!destination || !data.requestId) return;
      const navigationKey = `${data.type ?? "unknown"}:${data.role ?? "unknown"}:${data.requestId}`;
      const now = Date.now();
      if (
        lastNotificationNavigation.current?.key === navigationKey
        && now - lastNotificationNavigation.current.handledAt < 2_000
      ) {
        return;
      }
      lastNotificationNavigation.current = { key: navigationKey, handledAt: now };
      notificationNavigationHandled.current = true;
      router.navigate(destination);
    });

    return () => {
      unsubscribeAuth();
      subscription.remove();
    };
  }, [router]);

  return (
    <RegistrationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistrationProvider>
  );
}
