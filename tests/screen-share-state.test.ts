import { describe, expect, it } from "vitest";
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
import { toAwarenessSnapshot } from "@/lib/screen/browser";

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
});
