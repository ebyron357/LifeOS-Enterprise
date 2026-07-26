import { describe, expect, it } from "vitest";
import { buildBasenameIndex, resolveVaultTarget } from "@/lib/vault/resolve-link";

describe("wikilink resolution", () => {
  const paths = [
    "Projects/LifeOS Enterprise.md",
    "10 Projects/Build AI Consultant Portfolio.md",
    "20 Areas/Personal Growth.md",
  ];
  const pathIndex = new Set(paths);
  const basenameIndex = buildBasenameIndex(paths);

  it("resolves folder-qualified links", () => {
    expect(resolveVaultTarget("20 Areas/Personal Growth", "Projects/LifeOS Enterprise.md", pathIndex, basenameIndex))
      .toBe("20 Areas/Personal Growth.md");
  });

  it("resolves basename links from source folder context", () => {
    expect(resolveVaultTarget("LifeOS Enterprise", "Projects/Other.md", pathIndex, basenameIndex))
      .toBe("Projects/LifeOS Enterprise.md");
  });

  it("returns null for unresolved links", () => {
    expect(resolveVaultTarget("Missing Note", "Projects/LifeOS Enterprise.md", pathIndex, basenameIndex)).toBeNull();
  });
});
