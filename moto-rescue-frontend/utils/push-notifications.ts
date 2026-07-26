import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { userApi } from "../api/users";
import { translate } from "../localization/i18n";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushData = {
  type?: string;
  role?: "passenger" | "biker";
  requestId?: string;
};

function projectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

export function supportsRemotePushNotifications() {
  return Platform.OS !== "web"
    && Device.isDevice
    && !(Platform.OS === "android" && Constants.appOwnership === "expo");
}

export async function registerPushNotifications() {
  if (!supportsRemotePushNotifications()) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: translate("Rescue alerts"),
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF9500",
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const finalPermission = currentPermission.status === "granted"
    ? currentPermission
    : await Notifications.requestPermissionsAsync();
  if (finalPermission.status !== "granted") return null;

  const id = projectId();
  if (!id) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  await userApi.setPushToken(token);
  return token;
}

export async function unregisterPushNotifications() {
  await userApi.clearPushToken();
}

export function addNotificationResponseListener(listener: (data: PushData) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    listener(response.notification.request.content.data as PushData);
  });
}

export function addNotificationReceivedListener(listener: (data: PushData) => void) {
  return Notifications.addNotificationReceivedListener((notification) => {
    listener(notification.request.content.data as PushData);
  });
}

export function getInitialNotificationData(): PushData | null {
  const response = Notifications.getLastNotificationResponse();
  if (response) Notifications.clearLastNotificationResponse();
  return response?.notification.request.content.data as PushData | null;
}
