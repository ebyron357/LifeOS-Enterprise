import { describe, expect, it, vi } from "vitest";
import {
  beginScreenShareRequest,
  denyScreenShare,
  describeScreenShare,
  grantScreenShare,
  INITIAL_SCREEN_SHARE,
  isScreenContextStale,
  markUnsupported,
  pauseScreenAnalysis,
  resumeScreenAnalysis,
  stopScreenShare,
} from "@/lib/screen/state";
import { requestDisplayMedia, toAwarenessSnapshot } from "@/lib/screen/browser";

describe("screen share state", () => {
  it("never starts in a sharing state", () => {
    expect(INITIAL_SCREEN_SHARE.state).toBe("idle");
    expect(describeScreenShare(INITIAL_SCREEN_SHARE, Date.now())).toMatch(/No screen is being shared/);
  });

  it("records owner-granted share metadata and can pause analysis", () => {
    const requested = beginScreenShareRequest(INITIAL_SCREEN_SHARE);
    const sharing = grantScreenShare(requested, {
      sourceName: "Chrome Tab",
      width: 1440,
      height: 900,
      nowIso: "2026-08-26T12:00:00.000Z",
    });
    expect(sharing.state).toBe("sharing");
    const paused = pauseScreenAnalysis(sharing);
    expect(paused.state).toBe("paused");
    expect(describeScreenShare(paused, Date.parse("2026-08-26T12:00:01.000Z"))).toMatch(/analysis is paused/);
    const resumed = resumeScreenAnalysis(paused, "2026-08-26T12:00:05.000Z");
    expect(resumed.state).toBe("sharing");
  });

  it("handles denial, stop, unsupported, and stale snapshots", () => {
    expect(denyScreenShare(INITIAL_SCREEN_SHARE, "Permission denied.").state).toBe("denied");
    expect(stopScreenShare().state).toBe("ended");
    expect(markUnsupported().state).toBe("unsupported");
    const sharing = grantScreenShare(INITIAL_SCREEN_SHARE, {
      sourceName: "App",
      width: 800,
      height: 600,
      nowIso: "2026-08-26T12:00:00.000Z",
    });
    expect(isScreenContextStale(sharing, Date.parse("2026-08-26T12:00:20.000Z"))).toBe(true);
    expect(toAwarenessSnapshot(sharing, Date.parse("2026-08-26T12:00:20.000Z")).stale).toBe(true);
  });

  it("exposes the requesting state before the browser grant or denial settles", async () => {
    let releaseGrant: (stream: MediaStream) => void = () => {};
    const grant = new Promise<MediaStream>((resolve) => {
      releaseGrant = resolve;
    });
    const getDisplayMedia = vi.fn(() => grant);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getDisplayMedia },
    });
    const seen: string[] = [];
    const pending = requestDisplayMedia((snapshot) => {
      seen.push(snapshot.state);
    });
    await Promise.resolve();
    expect(seen).toEqual(["requesting"]);
    expect(describeScreenShare({
      ...INITIAL_SCREEN_SHARE,
      state: "requesting",
    }, Date.now())).toMatch(/Waiting for you to choose a screen/);

    const track = {
      label: "Chrome Tab",
      getSettings: () => ({ width: 1280, height: 720, displaySurface: "browser" }),
    };
    releaseGrant({
      getVideoTracks: () => [track],
      getTracks: () => [track],
    } as unknown as MediaStream);
    const result = await pending;
    expect(result.snapshot.state).toBe("sharing");
    expect(seen).toEqual(["requesting", "sharing"]);
  });
});
