import { describe, expect, it } from "vitest";
import { buildVaultIndex } from "@/lib/vault/build-index";
import { searchVault } from "@/lib/vault/index";

describe("vault search", () => {
  it("ranks title matches above body matches", async () => {
    const index = await buildVaultIndex(process.cwd());
    const results = searchVault(index, "LifeOS Enterprise");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].note.title.toLowerCase()).toContain("lifeos");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("filters by tag and type", async () => {
    const index = await buildVaultIndex(process.cwd());
    const project = index.notes.find((note) => note.type === "project");
    if (!project) return;

    const byType = searchVault(index, project.title, { type: "project" });
    expect(byType.every((result) => result.note.type === "project")).toBe(true);
  });
});
