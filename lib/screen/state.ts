export type ScreenShareState =
  | "idle"
  | "requesting"
  | "sharing"
  | "paused"
  | "denied"
  | "ended"
  | "unsupported";

export type ScreenShareSnapshot = {
  state: ScreenShareState;
  sourceName: string | null;
  width: number | null;
  height: number | null;
  startedAt: string | null;
  capturedAt: string | null;
  analysisPaused: boolean;
  error: string | null;
};

export const INITIAL_SCREEN_SHARE: ScreenShareSnapshot = {
  state: "idle",
  sourceName: null,
  width: null,
  height: null,
  startedAt: null,
  capturedAt: null,
  analysisPaused: false,
  error: null,
};

const STALE_MS = 15_000;

export function isScreenContextStale(snapshot: ScreenShareSnapshot, nowMs: number): boolean {
  if (!snapshot.capturedAt) return snapshot.state === "sharing" || snapshot.state === "paused";
  return nowMs - Date.parse(snapshot.capturedAt) > STALE_MS;
}

export function beginScreenShareRequest(snapshot: ScreenShareSnapshot): ScreenShareSnapshot {
  if (snapshot.state === "unsupported") return snapshot;
  return { ...snapshot, state: "requesting", error: null };
}

export function grantScreenShare(
  snapshot: ScreenShareSnapshot,
  details: { sourceName: string | null; width: number | null; height: number | null; nowIso: string },
): ScreenShareSnapshot {
  return {
    ...snapshot,
    state: "sharing",
    sourceName: details.sourceName,
    width: details.width,
    height: details.height,
    startedAt: details.nowIso,
    capturedAt: details.nowIso,
    analysisPaused: false,
    error: null,
  };
}

export function denyScreenShare(snapshot: ScreenShareSnapshot, message: string): ScreenShareSnapshot {
  return { ...INITIAL_SCREEN_SHARE, state: "denied", error: message };
}

export function markUnsupported(): ScreenShareSnapshot {
  return { ...INITIAL_SCREEN_SHARE, state: "unsupported", error: "Screen capture is not supported in this browser." };
}

export function stopScreenShare(): ScreenShareSnapshot {
  return { ...INITIAL_SCREEN_SHARE, state: "ended" };
}

export function pauseScreenAnalysis(snapshot: ScreenShareSnapshot): ScreenShareSnapshot {
  if (snapshot.state !== "sharing") return snapshot;
  return { ...snapshot, state: "paused", analysisPaused: true };
}

export function resumeScreenAnalysis(snapshot: ScreenShareSnapshot, nowIso: string): ScreenShareSnapshot {
  if (snapshot.state !== "paused") return snapshot;
  return { ...snapshot, state: "sharing", analysisPaused: false, capturedAt: nowIso };
}

export function refreshScreenFrame(
  snapshot: ScreenShareSnapshot,
  details: { width: number | null; height: number | null; nowIso: string; sourceName?: string | null },
): ScreenShareSnapshot {
  if (snapshot.state !== "sharing") return snapshot;
  return {
    ...snapshot,
    width: details.width,
    height: details.height,
    capturedAt: details.nowIso,
    sourceName: details.sourceName ?? snapshot.sourceName,
  };
}

export function describeScreenShare(snapshot: ScreenShareSnapshot, nowMs: number): string {
  if (snapshot.state === "unsupported") return "Screen capture is not available in this browser.";
  if (snapshot.state === "denied") return snapshot.error || "Screen share permission was denied.";
  if (snapshot.state === "ended" || snapshot.state === "idle") return "No screen is being shared.";
  if (snapshot.state === "requesting") return "Waiting for you to choose a screen or window.";
  const source = snapshot.sourceName || "an unnamed window";
  const size = snapshot.width && snapshot.height ? `${snapshot.width}×${snapshot.height}` : "unknown size";
  if (snapshot.state === "paused") {
    return `Screen sharing is on (${source}, ${size}), but analysis is paused. I will not guess what is on the screen.`;
  }
  if (isScreenContextStale(snapshot, nowMs)) {
    return `A screen named ${source} is shared (${size}), but the last visual snapshot is stale. I will not invent what you are looking at.`;
  }
  return `You are sharing ${source} (${size}). I can use this verified share metadata only. I will not fabricate visual details without a configured vision provider.`;
}
