import { apiRequest } from "./client";

export type UserProfile = {
  uid: string; name: string; email: string; phone: string; phoneVerified: boolean;
  role: "passenger" | "biker" | null; emergencyContact: string | null;
  profileEmoji: string | null; bio: string | null; profilePhotoPath: string | null; plateNumber: string | null;
  motorcycleModel: string | null; motorcycleColor: string | null;
  availableDays: boolean[] | null; online: boolean; notificationsEnabled: boolean;
  identityDocumentStatus: string; rating: number; totalRescues: number; createdAt: string;
};

export type ProfileUpdate = Partial<Pick<UserProfile,
  "name" | "emergencyContact" | "profileEmoji" | "bio" | "plateNumber" |
  "motorcycleModel" | "motorcycleColor" | "availableDays" | "online" | "notificationsEnabled"
>>;

export const userApi = {
  create: (input: { name: string; phone: string }) =>
    apiRequest<UserProfile>("/api/users/me", { method: "POST", body: JSON.stringify(input) }),
  get: () => apiRequest<UserProfile>("/api/users/me"),
  setRole: (role: "passenger" | "biker") =>
    apiRequest<UserProfile>("/api/users/me/role", { method: "PATCH", body: JSON.stringify({ role }) }),
  update: (input: ProfileUpdate) =>
    apiRequest<UserProfile>("/api/users/me", { method: "PATCH", body: JSON.stringify(input) }),
  setProfilePhoto: (storagePath: string) =>
    apiRequest<UserProfile>("/api/users/me/profile-photo", {
      method: "PATCH",
      body: JSON.stringify({ storagePath }),
    }),
  clearProfilePhoto: () =>
    apiRequest<void>("/api/users/me/profile-photo", { method: "DELETE" }),
  delete: () => apiRequest<void>("/api/users/me", { method: "DELETE" }),
};
