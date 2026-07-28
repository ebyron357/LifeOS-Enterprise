import { describe, expect, it } from "vitest";
import { resolveMotionPreference } from "@/lib/motion/preferences";

describe("motion preference resolution", () => {
  it("disables motion in overload mode", () => {
    expect(resolveMotionPreference({ overloaded: true, osReducedMotion: false })).toEqual({
      allowMotion: false,
      allowDecorativeMotion: false,
      reason: "overload",
    });
  });

  it("honors LifeOS reduced-motion toggle", () => {
    expect(resolveMotionPreference({ lifeosReducedMotion: true })).toMatchObject({
      allowMotion: false,
      reason: "lifeos",
    });
  });

  it("honors operating-system reduced motion", () => {
    expect(resolveMotionPreference({ osReducedMotion: true })).toMatchObject({
      allowMotion: false,
      reason: "os",
    });
  });

  it("allows motion when no accessibility constraints are active", () => {
    expect(resolveMotionPreference({ osReducedMotion: false })).toEqual({
      allowMotion: true,
      allowDecorativeMotion: true,
      reason: "enabled",
    });
  });
});
