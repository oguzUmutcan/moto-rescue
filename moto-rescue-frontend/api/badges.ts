import { apiRequest } from "./client";

export type Badge = {
  id: string; emoji: string; name: string; description: string;
  progress: number; target: number; earned: boolean; earnedAt: string | null;
};

export type BadgeSummary = {
  level: string; levelEmoji: string; xp: number; currentLevelXp: number;
  nextLevelXp: number; nextLevel: string; badges: Badge[];
};

export const badgeApi = {
  mine: () => apiRequest<BadgeSummary>("/api/badges/me"),
};
