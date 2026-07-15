import { apiRequest } from "./client";

export type Review = {
  id: string; rescueId: string; passengerId: string; passengerName: string;
  bikerId: string; bikerName: string; rating: number; comment: string; createdAt: string;
};

export const reviewApi = {
  create: (rescueId: string, rating: number, comment: string) =>
    apiRequest<Review>(`/api/reviews/rescue/${encodeURIComponent(rescueId)}`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),
  mine: () => apiRequest<Review[]>("/api/reviews/mine"),
  latest: () => apiRequest<Review[]>("/api/reviews"),
};
