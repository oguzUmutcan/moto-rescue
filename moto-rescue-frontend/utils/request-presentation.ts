type PresentationState = "presented" | "dismissed" | "handled";

type PresentationEntry = {
  state: PresentationState;
  expiresAt: number;
};

const DEFAULT_REQUEST_LIFETIME_MS = 5 * 60 * 1000;
const HANDLED_RETENTION_MS = 10 * 60 * 1000;
const entries = new Map<string, PresentationEntry>();
let presentedRequestId: string | null = null;

function prune(now = Date.now()) {
  for (const [requestId, entry] of entries) {
    if (entry.expiresAt <= now) {
      entries.delete(requestId);
      if (presentedRequestId === requestId) presentedRequestId = null;
    }
  }
}

function futureExpiry(expiresAt?: number, fallbackMs = DEFAULT_REQUEST_LIFETIME_MS) {
  const now = Date.now();
  return expiresAt && expiresAt > now ? expiresAt : now + fallbackMs;
}

export function claimIncomingRequest(
  requestId: string,
  options: { reopenDismissed?: boolean; expiresAt?: number } = {},
) {
  if (!requestId) return false;
  prune();
  if (presentedRequestId && presentedRequestId !== requestId) return false;

  const existing = entries.get(requestId);
  if (existing?.state === "presented" || existing?.state === "handled") return false;
  if (existing?.state === "dismissed" && !options.reopenDismissed) return false;

  entries.set(requestId, {
    state: "presented",
    expiresAt: futureExpiry(options.expiresAt),
  });
  presentedRequestId = requestId;
  return true;
}

export function ensureIncomingRequestPresented(requestId: string, expiresAt?: number) {
  prune();
  const existing = entries.get(requestId);
  if (existing?.state === "presented") {
    presentedRequestId = requestId;
    return true;
  }
  return claimIncomingRequest(requestId, { reopenDismissed: true, expiresAt });
}

export function dismissIncomingRequest(requestId: string, expiresAt?: number) {
  prune();
  const existing = entries.get(requestId);
  if (existing?.state !== "presented") return;
  entries.set(requestId, {
    state: "dismissed",
    expiresAt: futureExpiry(expiresAt),
  });
  if (presentedRequestId === requestId) presentedRequestId = null;
}

export function handleIncomingRequest(requestId: string) {
  if (!requestId) return;
  entries.set(requestId, {
    state: "handled",
    expiresAt: Date.now() + HANDLED_RETENTION_MS,
  });
  if (presentedRequestId === requestId) presentedRequestId = null;
}

export function resetRequestPresentationForTests() {
  entries.clear();
  presentedRequestId = null;
}
