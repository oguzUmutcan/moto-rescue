import {
  bikerRescueRoute,
  notificationRoute,
  passengerRescueRoute,
  profileRoute,
} from "@/utils/app-routing";

describe("app routing decisions", () => {
  test("restores each signed-in role to its dashboard", () => {
    expect(profileRoute({ role: "passenger" })).toBe("/(passenger)/(tabs)/dashboard");
    expect(profileRoute({ role: "biker" })).toBe("/(biker)/(tabs)/dashboard");
    expect(profileRoute({ role: null })).toBe("/(auth)/profile-select");
  });

  test("restores passenger searching and active ride screens", () => {
    expect(passengerRescueRoute({ id: "r1", status: "searching" })).toEqual({
      pathname: "/(passenger)/searching",
      params: { requestId: "r1" },
    });
    expect(passengerRescueRoute({ id: "r1", status: "in_progress" })).toEqual({
      pathname: "/(passenger)/ride",
      params: { requestId: "r1" },
    });
  });

  test("restores biker pending and active rescue screens", () => {
    expect(bikerRescueRoute({ id: "r1", status: "searching" })).toEqual({
      pathname: "/(biker)/incoming",
      params: { requestId: "r1" },
    });
    expect(bikerRescueRoute({ id: "r1", status: "accepted" })).toEqual({
      pathname: "/(biker)/navigation",
      params: { requestId: "r1" },
    });
  });

  test("routes every notification state to its canonical screen", () => {
    expect(notificationRoute({ role: "biker", type: "rescue_request", requestId: "r1" }))
      .toEqual({ pathname: "/(biker)/incoming", params: { requestId: "r1" } });
    expect(notificationRoute({ role: "biker", type: "rescue_cancelled", requestId: "r1" }))
      .toBe("/(biker)/(tabs)/dashboard");
    expect(notificationRoute({ role: "passenger", type: "rescue_started", requestId: "r1" }))
      .toEqual({ pathname: "/(passenger)/ride", params: { requestId: "r1" } });
    expect(notificationRoute({ role: "passenger", type: "rescue_completed", requestId: "r1" }))
      .toEqual({ pathname: "/(passenger)/review", params: { requestId: "r1" } });
  });
});
