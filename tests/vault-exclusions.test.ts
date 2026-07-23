import { describe, expect, it } from "vitest";
import { isExcludedPath, isIndexableMarkdown, isPrivateFrontmatter } from "@/lib/vault/exclusions";

describe("vault exclusions", () => {
  it("excludes git, env, and build paths", () => {
    expect(isExcludedPath(".git/config")).toBe(true);
    expect(isExcludedPath(".github/workflows/dashboard-ci.yml")).toBe(true);
    expect(isExcludedPath(".obsidian/workspace.json")).toBe(true);
    expect(isExcludedPath(".env")).toBe(true);
    expect(isExcludedPath("node_modules/react/index.js")).toBe(true);
    expect(isExcludedPath("app/dashboard/page.tsx")).toBe(true);
    expect(isExcludedPath("lib/vault/index.ts")).toBe(true);
  });

  it("allows vault markdown paths", () => {
    expect(isExcludedPath("10 Projects/Build AI Consultant Portfolio.md")).toBe(false);
    expect(isExcludedPath("docs/LifeOS_Specification_v1.md")).toBe(false);
    expect(isIndexableMarkdown("Projects/LifeOS Enterprise.md")).toBe(true);
  });

  it("honors private frontmatter flags", () => {
    expect(isPrivateFrontmatter({ private: true })).toBe(true);
    expect(isPrivateFrontmatter({ publish: false })).toBe(true);
    expect(isPrivateFrontmatter({ web_visibility: "private" })).toBe(true);
    expect(isPrivateFrontmatter({ status: "active" })).toBe(false);
  });
});
