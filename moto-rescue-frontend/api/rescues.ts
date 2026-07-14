import { auth } from "../config/firebase";
import { Platform } from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080");

export type RescueRequest = {
  id: string;
  passengerId: string;
  passengerName: string;
  latitude: number;
  longitude: number;
  destinationLabel: string;
  urgency: string;
  needsHelmet: boolean;
  status: "searching" | "accepted" | "cancelled" | "arriving" | "active" | "completed";
  bikerId: string | null;
  bikerName: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
};

type CreateRescueInput = {
  latitude: number;
  longitude: number;
  destinationLabel: string;
  urgency: string;
  needsHelmet: boolean;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  const idToken = await user.getIdToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail || payload?.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const rescueApi = {
  create: (input: CreateRescueInput) =>
    request<RescueRequest>("/api/rescues", { method: "POST", body: JSON.stringify(input) }),
  get: (id: string) => request<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}`),
  open: () => request<RescueRequest[]>("/api/rescues/open"),
  accept: (id: string) =>
    request<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/accept`, { method: "POST" }),
  cancel: (id: string) =>
    request<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/cancel`, { method: "POST" }),
};
