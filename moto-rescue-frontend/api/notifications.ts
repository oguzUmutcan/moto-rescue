import { apiRequest } from "./client";

export type ActivityNotification = {
  id: string;
  type: string;
  role: "passenger" | "biker";
  requestId: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string | null;
};

export const notificationApi = {
  list: () => apiRequest<ActivityNotification[]>("/api/notifications"),
  markRead: (notificationId: string) =>
    apiRequest<ActivityNotification>(
      `/api/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: "PATCH" },
    ),
  markAllRead: () =>
    apiRequest<void>("/api/notifications/read-all", { method: "PATCH" }),
};
