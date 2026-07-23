import Constants from "expo-constants";
import { Platform } from "react-native";

import { auth } from "../config/firebase";
import { getActiveLanguage, translate, translateError } from "../localization/i18n";

function resolveApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (Platform.OS !== "web" && expoHost) return `http://${expoHost}:8083`;

  return Platform.OS === "android"
    ? "http://10.0.2.2:8083"
    : "http://localhost:8083";
}

export const API_URL = resolveApiUrl();

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error(translate("You must be signed in."));
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        "Accept-Language": getActiveLanguage(),
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new Error(
      `${translate("Backend is unreachable. Make sure it is running and that your phone and computer are on the same network.")} (${API_URL})`,
      { cause: error },
    );
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      translateError(
        payload?.detail || payload?.error || `Request failed (${response.status})`,
        `Request failed (${response.status})`,
      ),
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  return (body ? JSON.parse(body) : undefined) as T;
}
