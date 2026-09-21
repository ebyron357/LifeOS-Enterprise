import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(path.join(process.cwd(), "app/api/lifeos/prompts/route.ts"), "utf8");

describe("prompt intelligence route contract", () => {
  it("is a read-only prompt index endpoint", () => {
    expect(routeSource).toContain("prompt-intelligence");
    expect(routeSource).toContain("write: false");
    expect(routeSource).toContain("collectPromptRecords");
    expect(routeSource).toContain("toAgentPromptView");
    expect(routeSource).not.toContain("LIFEOS_WRITE_SECRET");
    expect(routeSource).not.toMatch(/function POST/);
  });
});
