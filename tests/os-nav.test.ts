import { describe, expect, it } from "vitest";
import { ADVANCED_NAV, MORE_PRIMARY_NAV, PRIMARY_NAV, isNavActive } from "@/lib/os/nav";

describe("LifeOS primary navigation", () => {
  it("keeps intent-first destinations and hides advanced browse from the primary list", () => {
    expect(PRIMARY_NAV.map((item) => item.href)).toEqual([
      "/",
      "/conversation",
      "/projects",
      "/today",
      "/inbox",
      "/journal",
      "/learning",
      "/files",
      "/automations",
      "/integrations",
    ]);
    expect(PRIMARY_NAV.every((item) => item.intent !== "more")).toBe(true);
    expect(ADVANCED_NAV.some((item) => item.href === "/dashboard")).toBe(true);
    expect(ADVANCED_NAV.some((item) => item.href === "/search")).toBe(true);
    expect(MORE_PRIMARY_NAV.map((item) => item.href)).toEqual([
      "/today",
      "/journal",
      "/learning",
      "/files",
      "/automations",
      "/integrations",
    ]);
  });

  it("treats home as exact-match only", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/projects", "/")).toBe(false);
    expect(isNavActive("/projects/workspace", "/projects")).toBe(true);
  });
});
