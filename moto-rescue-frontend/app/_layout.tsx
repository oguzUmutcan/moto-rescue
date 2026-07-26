import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";

import "@/global.css";
import { RegistrationProvider } from "@/contexts/registration";
import { auth } from "@/config/firebase";
import { clearCachedProfile, getCachedProfile, userApi } from "@/api/users";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getInitialNotificationData,
  PushData,
  registerPushNotifications,
  unregisterPushNotifications,
} from "@/utils/push-notifications";
import { notificationRoute, profileRoute } from "@/utils/app-routing";
import { claimIncomingRequest } from "@/utils/request-presentation";
import { LanguageProvider, useLanguage } from "@/localization/language-context";

// Initialize background location task globally
import "@/utils/background-location";

function RootNavigator() {
  const router = useRouter();
  const { ready: languageReady, syncAccountLanguage } = useLanguage();
  const handledNotificationKeys = useRef(new Set<string>());
  const notificationNavigationHandled = useRef(false);

  useEffect(() => {
    if (!languageReady) return;
    let profileReady = false;
    let pendingResponse: PushData | null = getInitialNotificationData();
    if (pendingResponse) notificationNavigationHandled.current = true;

    const navigateFromNotification = (data: PushData, reopenDismissed: boolean) => {
      const destination = notificationRoute(data);
      if (!destination || !data.requestId) return;

      if (data.role === "biker" && data.type === "rescue_request") {
        if (!claimIncomingRequest(data.requestId, { reopenDismissed })) return;
      } else {
        const navigationKey = `${data.type ?? "unknown"}:${data.role ?? "unknown"}:${data.requestId}`;
        if (handledNotificationKeys.current.has(navigationKey)) return;
        handledNotificationKeys.current.add(navigationKey);
      }

      notificationNavigationHandled.current = true;
      router.navigate(destination);
    };

    const handleResponse = (data: PushData) => {
      if (!profileReady) {
        pendingResponse = data;
        notificationNavigationHandled.current = true;
        return;
      }
      navigateFromNotification(data, true);
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        profileReady = false;
        pendingResponse = null;
        notificationNavigationHandled.current = false;
        void getCachedProfile().then(async (cachedProfile) => {
          await clearCachedProfile();
          if (cachedProfile) router.replace("/(auth)/login");
        });
        return;
      }
      userApi.get()
        .then(async (profile) => {
          await syncAccountLanguage(profile.language);
          if (profile.notificationsEnabled) {
            await registerPushNotifications();
          } else {
            await unregisterPushNotifications();
          }
          profileReady = true;
          if (pendingResponse) {
            const response = pendingResponse;
            pendingResponse = null;
            navigateFromNotification(response, true);
          } else if (!notificationNavigationHandled.current) {
            router.replace(profileRoute(profile));
          }
        })
        .catch((error) => {
          console.warn("Could not sync push notifications", error);
        });
    });

    const responseSubscription = addNotificationResponseListener(handleResponse);
    const receivedSubscription = addNotificationReceivedListener((data) => {
      if (
        profileReady
        && data.role === "biker"
        && data.type === "rescue_request"
      ) {
        navigateFromNotification(data, false);
      }
    });

    return () => {
      unsubscribeAuth();
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [languageReady, router, syncAccountLanguage]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <LanguageProvider>
        <RegistrationProvider>
          <RootNavigator />
        </RegistrationProvider>
      </LanguageProvider>
    </KeyboardProvider>
  );
}
