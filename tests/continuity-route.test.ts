import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(path.join(process.cwd(), "app/api/lifeos/continuity/route.ts"), "utf8");

describe("continuity route contract", () => {
  it("is a read-only derived resume endpoint", () => {
    expect(routeSource).toContain("derived-resume-package");
    expect(routeSource).toContain("write: false");
    expect(routeSource).toContain("getContinuityResumePackage");
    expect(routeSource).not.toContain("LIFEOS_GITHUB_TOKEN");
    expect(routeSource).not.toMatch(/function POST/);
  });
});
