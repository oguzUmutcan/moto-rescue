import Constants from "expo-constants";
import { Platform } from "react-native";
import { auth } from "../config/firebase";

function resolveApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  // Expo Go on a physical device cannot reach the developer PC through
  // localhost or Android-emulator-only 10.0.2.2. Metro's host is the PC's
  // reachable LAN address, so use it for native development automatically.
  const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (Platform.OS !== "web" && expoHost) return `http://${expoHost}:8083`;

  return Platform.OS === "android"
    ? "http://10.0.2.2:8083"
    : "http://localhost:8083";
}

export const API_URL = resolveApiUrl();

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new Error(
      `Backend'e ulaşılamadı (${API_URL}). Backend'in çalıştığını ve telefon ile bilgisayarın aynı ağda olduğunu kontrol edin.`,
      { cause: error },
    );
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || payload?.error || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  return (body ? JSON.parse(body) : undefined) as T;
}
