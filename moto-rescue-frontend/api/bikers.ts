import { apiRequest } from "./client";

export type PublicBikerSummary = {
  uid: string;
  name: string;
  profilePhotoPath: string | null;
  bio: string | null;
  motorcycleModel: string | null;
  motorcycleColor: string | null;
  rating: number;
  reviewCount: number;
  totalRescues: number;
};

export type PublicBikerReview = {
  id: string;
  passengerName: string;
  rating: number;
  comment: string | null;
  createdAt: string | null;
};

export type PublicRescueHistory = {
  urgency: string | null;
  helmetProvided: boolean;
  completedAt: string | null;
};

export type PublicBikerProfile = {
  biker: PublicBikerSummary;
  reviews: PublicBikerReview[];
  rescueHistory: PublicRescueHistory[];
};

export const bikerApi = {
  search: (query: string) =>
    apiRequest<PublicBikerSummary[]>(`/api/bikers?query=${encodeURIComponent(query.trim())}`),
  get: (uid: string) =>
    apiRequest<PublicBikerProfile>(`/api/bikers/${encodeURIComponent(uid)}`),
};
