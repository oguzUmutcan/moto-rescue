import { apiRequest } from "./client";

export type RescueRequest = {
  id: string;
  passengerId: string;
  passengerName: string;
  latitude: number;
  longitude: number;
  destinationLabel: string;
  urgency: string;
  needsHelmet: boolean;
  status: "searching" | "accepted" | "in_progress" | "cancelled" | "completed";
  bikerId: string | null;
  bikerName: string | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

type CreateRescueInput = {
  latitude: number;
  longitude: number;
  destinationLabel: string;
  urgency: string;
  needsHelmet: boolean;
};

export const rescueApi = {
  create: (input: CreateRescueInput) =>
    apiRequest<RescueRequest>("/api/rescues", { method: "POST", body: JSON.stringify(input) }),
  get: (id: string) => apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}`),
  open: () => apiRequest<RescueRequest[]>("/api/rescues/open"),
  history: () => apiRequest<RescueRequest[]>("/api/rescues/history"),
  accept: (id: string) =>
    apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/accept`, { method: "POST" }),
  cancel: (id: string) =>
    apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/cancel`, { method: "POST" }),
  start: (id: string) =>
    apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/start`, { method: "POST" }),
  complete: (id: string) =>
    apiRequest<RescueRequest>(`/api/rescues/${encodeURIComponent(id)}/complete`, { method: "POST" }),
};
