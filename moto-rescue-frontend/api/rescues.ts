import { apiRequest } from "./client";

export type RescueRequest = {
  id: string;
  passengerId: string;
  passengerName: string;
  latitude: number;
  longitude: number;
  pickupLabel: string;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
  urgency: string;
  needsHelmet: boolean;
  status: "searching" | "accepted" | "in_progress" | "cancelled" | "completed";
  bikerId: string | null;
  bikerName: string | null;
  bikerProfilePhotoPath: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  boardingCode: string | null;
  boardingVerifiedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  bikerLatitude: number | null;
  bikerLongitude: number | null;
  bikerLocationUpdatedAt: string | null;
};

type CreateRescueInput = {
  latitude: number;
  longitude: number;
  pickupLabel: string;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
  urgency: string;
  needsHelmet: boolean;
};

export const rescueApi = {
  create: (input: CreateRescueInput) =>
    apiRequest<RescueRequest>("/api/rescues", { method: "POST", body: JSON.stringify(input) }),
  get: (id: string) => apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}`),
  open: () => apiRequest<RescueRequest[]>("/api/rescues/open"),
  history: () => apiRequest<RescueRequest[]>("/api/rescues/history"),
  active: () => apiRequest<RescueRequest | null>("/api/rescues/active"),
  accept: (id: string) =>
    apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/accept`, { method: "POST" }),
  cancel: (id: string) =>
    apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/cancel`, { method: "POST" }),
  start: (id: string, boardingCode: string) =>
    apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/start`, {
      method: "POST",
      body: JSON.stringify({ boardingCode }),
    }),
  complete: (id: string) =>
    apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/complete`, { method: "POST" }),
  updateBikerLocation: (id: string, latitude: number, longitude: number) =>
    apiRequest<void>(`/api/rescues/${encodeURIComponent(id)}/biker-location`, {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    }),
};
