import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.join(process.cwd(), "components/dashboard/InteractiveCommandCenter.tsx"),
  "utf8",
);

describe("Interactive Operations Visual V1 safety contract", () => {
  it("provides staged project controls and an approval gate", () => {
    expect(source).toContain('type BoardStatus = "active" | "waiting" | "blocked" | "complete"');
    expect(source).toContain("Review staged changes");
    expect(source).toContain("Generate approval package");
    expect(source).toContain("Approval blocked");
  });

  it("supports priority and next-action editing", () => {
    expect(source).toContain('field: "status" | "priority" | "next_action"');
    expect(source).toContain("Priority");
    expect(source).toContain("Next action");
    expect(source).toContain("next action must contain at least 8 characters");
  });

  it("keeps persistence proposal-only and uses accessible dnd-kit sensors", () => {
    expect(source).toContain('schema: "lifeos.change-plan.v1"');
    expect(source).toContain('write_mode: "proposal-only"');
    expect(source).toContain("Canonical vault files remain unchanged");
    expect(source).toContain("KeyboardSensor");
    expect(source).toContain("TouchSensor");
    expect(source).toContain("PointerSensor");
    expect(source).toContain("DragOverlay");
    expect(source).toContain("aria-live");
    expect(source).not.toContain("GITHUB_TOKEN");
    expect(source).not.toContain("fetch(\"https://api.github.com");
  });

  it("never writes directly to main from the board", () => {
    expect(source).not.toContain('BASE = "main"');
    expect(source).toContain("proposal-only");
  });
});
