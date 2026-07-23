import type { RescueRequest } from "@/api/rescues";
import type { UserProfile } from "@/api/users";
import type { Href } from "expo-router";

export type AppRoute = Href;

type NotificationData = {
  type?: string;
  role?: string;
  requestId?: string;
};

export function profileRoute(profile: Pick<UserProfile, "role">): AppRoute {
  if (profile.role === "passenger") return "/(passenger)/(tabs)/dashboard";
  if (profile.role === "biker") return "/(biker)/(tabs)/dashboard";
  return "/(auth)/profile-select";
}

export function passengerRescueRoute(
  rescue: Pick<RescueRequest, "id" | "status">,
): AppRoute {
  return {
    pathname:
      rescue.status === "searching"
        ? "/(passenger)/searching"
        : "/(passenger)/ride",
    params: { requestId: rescue.id },
  };
}

export function bikerRescueRoute(
  rescue: Pick<RescueRequest, "id" | "status">,
): AppRoute {
  return {
    pathname:
      rescue.status === "searching"
        ? "/(biker)/incoming"
        : "/(biker)/navigation",
    params: { requestId: rescue.id },
  };
}

export function notificationRoute(data: NotificationData): AppRoute | null {
  if (!data.requestId) return null;
  if (data.role === "biker") {
    if (data.type === "rescue_cancelled") {
      return "/(biker)/(tabs)/dashboard";
    }
    return {
      pathname: "/(biker)/incoming",
      params: { requestId: data.requestId },
    };
  }
  if (data.type === "rescue_completed") {
    return {
      pathname: "/(passenger)/review",
      params: { requestId: data.requestId },
    };
  }
  if (data.type === "rescue_started") {
    return {
      pathname: "/(passenger)/ride",
      params: { requestId: data.requestId },
    };
  }
  return {
    pathname: "/(passenger)/searching",
    params: { requestId: data.requestId },
  };
}
