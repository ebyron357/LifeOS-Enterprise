import { describe, expect, it } from "vitest";
import { ACCENTS, accentFor, accentForName } from "@/lib/os/accents";
import { ADVANCED_NAV, MOBILE_NAV, PRIMARY_NAV } from "@/lib/os/nav";

describe("life-area accents", () => {
  it("gives every navigation destination a known accent", () => {
    for (const item of [...PRIMARY_NAV, ...MOBILE_NAV, ...ADVANCED_NAV]) {
      expect(ACCENTS).toContain(accentFor(item.href));
    }
  });

  it("keeps one color per area and falls back to the section, then neutral", () => {
    expect(accentFor("/conversation")).toBe("rose");
    expect(accentFor("/resources/review")).toBe("coral");
    expect(accentFor("/projects?focus=charlotte#next")).toBe("blue");
    expect(accentFor("/unknown-route")).toBe("slate");
  });

  it("gives a record the same accent every time, regardless of case or padding", () => {
    const first = accentForName("Charlotte Real Estate System");
    expect(ACCENTS).toContain(first);
    expect(accentForName("  charlotte real estate system ")).toBe(first);
  });
});
