import { apiRequest } from "./client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_CACHE_KEY = "@motorescue_profile_cache";

export const getCachedProfile = async (): Promise<UserProfile | null> => {
  try {
    const json = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
};

export const clearCachedProfile = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {}
};

const saveProfileCache = async (profile: UserProfile): Promise<UserProfile> => {
  try {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {}
  return profile;
};

export type UserProfile = {
  uid: string; name: string; email: string; phone: string; phoneVerified: boolean; language: "en" | "tr" | null;
  role: "passenger" | "biker" | null; emergencyContact: string | null;
  profileEmoji: string | null; bio: string | null; profilePhotoPath: string | null; plateNumber: string | null;
  motorcycleModel: string | null; motorcycleColor: string | null;
  availableDays: boolean[] | null; online: boolean; notificationsEnabled: boolean;
  identityDocumentStatus: "not_submitted" | "pending" | "verified" | "rejected";
  identityDocumentFrontPath: string | null; identityDocumentBackPath: string | null;
  identityDocumentSubmittedAt: string | null; rating: number; totalRescues: number; createdAt: string;
};

export type ProfileUpdate = Partial<Pick<UserProfile,
  "name" | "phone" | "emergencyContact" | "profileEmoji" | "bio" | "plateNumber" |
  "motorcycleModel" | "motorcycleColor" | "availableDays" | "online" | "notificationsEnabled" | "language"
>>;

export const userApi = {
  create: (input: { name: string; phone: string; language?: "en" | "tr" }) =>
    apiRequest<UserProfile>("/api/users/me", { method: "POST", body: JSON.stringify(input) }).then(saveProfileCache),
  get: () => apiRequest<UserProfile>("/api/users/me").then(saveProfileCache),
  setRole: (role: "passenger" | "biker") =>
    apiRequest<UserProfile>("/api/users/me/role", { method: "PATCH", body: JSON.stringify({ role }) }).then(saveProfileCache),
  update: (input: ProfileUpdate) =>
    apiRequest<UserProfile>("/api/users/me", { method: "PATCH", body: JSON.stringify(input) }).then(saveProfileCache),
  setProfilePhoto: (storagePath: string) =>
    apiRequest<UserProfile>("/api/users/me/profile-photo", {
      method: "PATCH",
      body: JSON.stringify({ storagePath }),
    }).then(saveProfileCache),
  clearProfilePhoto: () =>
    apiRequest<void>("/api/users/me/profile-photo", { method: "DELETE" }),
  setPushToken: (expoPushToken: string) =>
    apiRequest<UserProfile>("/api/users/me/push-token", {
      method: "PATCH",
      body: JSON.stringify({ expoPushToken }),
    }).then(saveProfileCache),
  clearPushToken: () =>
    apiRequest<void>("/api/users/me/push-token", { method: "DELETE" }),
  submitIdentityDocument: (frontStoragePath: string, backStoragePath: string) =>
    apiRequest<UserProfile>("/api/users/me/identity-document", {
      method: "POST",
      body: JSON.stringify({ frontStoragePath, backStoragePath }),
    }).then(saveProfileCache),
  delete: () => apiRequest<void>("/api/users/me", { method: "DELETE" }).then(clearCachedProfile),
  updateLocation: (latitude: number, longitude: number) =>
    apiRequest<void>("/api/users/me/location", { method: "PATCH", body: JSON.stringify({ latitude, longitude }) }),
};
