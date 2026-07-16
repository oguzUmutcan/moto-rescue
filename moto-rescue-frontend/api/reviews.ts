import { apiRequest } from "./client";

export type Review = {
  id: string; rescueId: string; passengerId: string; passengerName: string;
  passengerProfilePhotoPath: string | null; bikerId: string; bikerName: string;
  bikerProfilePhotoPath: string | null; rating: number; comment: string; createdAt: string;
};

export const reviewApi = {
  create: (rescueId: string, rating: number, comment: string) =>
    apiRequest<Review>(`/api/reviews/rescue/${encodeURIComponent(rescueId)}`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),
  mine: () => apiRequest<Review[]>("/api/reviews/mine"),
  received: () => apiRequest<Review[]>("/api/reviews/received"),
  latest: () => apiRequest<Review[]>("/api/reviews"),
};
