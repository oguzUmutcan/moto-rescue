import {
  claimIncomingRequest,
  dismissIncomingRequest,
  handleIncomingRequest,
  resetRequestPresentationForTests,
} from "@/utils/request-presentation";

describe("incoming request presentation", () => {
  beforeEach(() => {
    resetRequestPresentationForTests();
  });

  test("polling and push cannot present the same request twice", () => {
    expect(claimIncomingRequest("request-1")).toBe(true);
    expect(claimIncomingRequest("request-1")).toBe(false);
  });

  test("only one incoming request sheet can be active", () => {
    expect(claimIncomingRequest("request-1")).toBe(true);
    expect(claimIncomingRequest("request-2")).toBe(false);
  });

  test("polling respects a decline while an explicit notification tap may reopen it", () => {
    expect(claimIncomingRequest("request-1")).toBe(true);
    dismissIncomingRequest("request-1");
    expect(claimIncomingRequest("request-1")).toBe(false);
    expect(claimIncomingRequest("request-1", { reopenDismissed: true })).toBe(true);
  });

  test("accepted requests can never be presented again in the same session", () => {
    expect(claimIncomingRequest("request-1")).toBe(true);
    handleIncomingRequest("request-1");
    expect(claimIncomingRequest("request-1", { reopenDismissed: true })).toBe(false);
  });
});
