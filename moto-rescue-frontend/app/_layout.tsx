import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef } from "react";

import "@/global.css";
import { RegistrationProvider } from "@/contexts/registration";
import { auth } from "@/config/firebase";
import { userApi } from "@/api/users";
import { addNotificationResponseListener, registerPushNotifications, unregisterPushNotifications } from "@/utils/push-notifications";
import { notificationRoute, profileRoute } from "@/utils/app-routing";
import { LanguageProvider, useLanguage } from "@/localization/language-context";

// Initialize background location task globally
import "@/utils/background-location";

function RootNavigator() {
  const router = useRouter();
  const { ready: languageReady, syncAccountLanguage } = useLanguage();
  const lastNotificationNavigation = useRef<{ key: string; handledAt: number } | null>(null);
  const notificationNavigationHandled = useRef(false);

  useEffect(() => {
    if (!languageReady) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      userApi.get()
        .then(async (profile) => {
          await syncAccountLanguage(profile.language);
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
  }, [languageReady, router, syncAccountLanguage]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <RegistrationProvider>
        <RootNavigator />
      </RegistrationProvider>
    </LanguageProvider>
  );
}
