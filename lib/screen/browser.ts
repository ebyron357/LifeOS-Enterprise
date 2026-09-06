import {
  beginScreenShareRequest,
  denyScreenShare,
  grantScreenShare,
  INITIAL_SCREEN_SHARE,
  markUnsupported,
  pauseScreenAnalysis,
  refreshScreenFrame,
  resumeScreenAnalysis,
  stopScreenShare,
  type ScreenShareSnapshot,
} from "./state";
import type { ScreenAwarenessSnapshot } from "@/lib/agent/types";

export function toAwarenessSnapshot(snapshot: ScreenShareSnapshot, nowMs: number): ScreenAwarenessSnapshot {
  const stale = snapshot.capturedAt ? nowMs - Date.parse(snapshot.capturedAt) > 15_000 : snapshot.state === "sharing";
  return {
    sharing: snapshot.state === "sharing" || snapshot.state === "paused",
    paused: snapshot.analysisPaused || snapshot.state === "paused",
    sourceName: snapshot.sourceName,
    width: snapshot.width,
    height: snapshot.height,
    capturedAt: snapshot.capturedAt,
    stale,
    permission:
      snapshot.state === "denied"
        ? "denied"
        : snapshot.state === "unsupported"
          ? "unsupported"
          : snapshot.state === "ended"
            ? "ended"
            : snapshot.state === "sharing" || snapshot.state === "paused"
              ? "granted"
              : "prompt",
    analysisAllowed: snapshot.state === "sharing" && !snapshot.analysisPaused,
  };
}

export async function requestDisplayMedia(
  onState?: (snapshot: ScreenShareSnapshot) => void,
): Promise<{
  stream: MediaStream | null;
  snapshot: ScreenShareSnapshot;
}> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    const unsupported = markUnsupported();
    onState?.(unsupported);
    return { stream: null, snapshot: unsupported };
  }
  const requesting = beginScreenShareRequest(INITIAL_SCREEN_SHARE);
  onState?.(requesting);
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings();
    const nowIso = new Date().toISOString();
    const snapshot = grantScreenShare(requesting, {
      sourceName: track?.label || settings?.displaySurface || "shared window",
      width: settings?.width ?? null,
      height: settings?.height ?? null,
      nowIso,
    });
    onState?.(snapshot);
    return { stream, snapshot };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Screen share permission was denied.";
    const snapshot = denyScreenShare(requesting, message);
    onState?.(snapshot);
    return { stream: null, snapshot };
  }
}

export { pauseScreenAnalysis, refreshScreenFrame, resumeScreenAnalysis, stopScreenShare };
