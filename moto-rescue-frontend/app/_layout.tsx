import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

import "@/global.css";
import { RegistrationProvider } from "@/contexts/registration";
import { auth } from "@/config/firebase";
import { userApi } from "@/api/users";
import { addNotificationResponseListener, registerPushNotifications, unregisterPushNotifications } from "@/utils/push-notifications";

export default function RootLayout() {
  const router = useRouter();

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
        })
        .catch((error) => {
          console.warn("Could not sync push notifications", error);
        });
    });

    const subscription = addNotificationResponseListener((data) => {
      if (!data.requestId) return;
      if (data.role === "biker") {
        if (data.type === "rescue_cancelled") {
          router.push("/(biker)/(tabs)/dashboard");
          return;
        }
        router.push({ pathname: "/(biker)/incoming", params: { requestId: data.requestId } });
        return;
      }
      if (data.type === "rescue_completed") {
        router.push({ pathname: "/(passenger)/review", params: { requestId: data.requestId } });
        return;
      }
      if (data.type === "rescue_started") {
        router.push({ pathname: "/(passenger)/ride", params: { requestId: data.requestId } });
        return;
      }
      router.push({ pathname: "/(passenger)/searching", params: { requestId: data.requestId } });
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
