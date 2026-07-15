import { apiRequest } from "./client";

export type UserProfile = {
  uid: string; name: string; email: string; phone: string; phoneVerified: boolean;
  role: "passenger" | "biker" | null; emergencyContact: string | null;
  profileEmoji: string | null; bio: string | null; profilePhotoPath: string | null; plateNumber: string | null;
  motorcycleModel: string | null; motorcycleColor: string | null;
  availableDays: boolean[] | null; online: boolean; notificationsEnabled: boolean;
  identityDocumentStatus: "not_submitted" | "pending" | "verified" | "rejected";
  identityDocumentFrontPath: string | null; identityDocumentBackPath: string | null;
  identityDocumentSubmittedAt: string | null; rating: number; totalRescues: number; createdAt: string;
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
  submitIdentityDocument: (frontStoragePath: string, backStoragePath: string) =>
    apiRequest<UserProfile>("/api/users/me/identity-document", {
      method: "POST",
      body: JSON.stringify({ frontStoragePath, backStoragePath }),
    }),
  delete: () => apiRequest<void>("/api/users/me", { method: "DELETE" }),
  updateLocation: (latitude: number, longitude: number) =>
    apiRequest<void>("/api/users/me/location", { method: "PATCH", body: JSON.stringify({ latitude, longitude }) }),
};
