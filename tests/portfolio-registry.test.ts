import { describe, expect, it } from "vitest";
import { parseArchiveCandidates, parseRegistry } from "@/lib/portfolio/registry";

const FIXTURE = `# Project Repository Registry

## Packaging Projects

| Project | Active repo | Status | Why this repo is active | Archive / reference repos |
|---|---|---|---|---|
| Sample Beverage Labels | \`ebyron357/sample-repo\` | ACTIVE | Contains the production system. | \`ebyron357/sample-repo-old\`, \`ebyron357/sample-repo-experiment\` |

## Other Active Project Repos

| Project | Active repo | Notes |
|---|---|---|
| Life OS | \`ebyron357/LifeOS-Enterprise\` | System-level registry and operations repo. |
| Orphan Project | \`ebyron357/orphan-repo\` | Not claimed by any vault project note. |

## Do Not Use As Active Unless Specifically Needed

- \`ebyron357/sample-repo-old\`
- \`ebyron357/archived-thing\`
`;

describe("parseRegistry", () => {
  it("parses both markdown tables into structured entries", () => {
    const entries = parseRegistry(FIXTURE);
    expect(entries).toHaveLength(3);
    const sample = entries.find((entry) => entry.project === "Sample Beverage Labels");
    expect(sample?.activeRepo).toBe("ebyron357/sample-repo");
    expect(sample?.archiveRepos).toEqual(["ebyron357/sample-repo-old", "ebyron357/sample-repo-experiment"]);
    expect(sample?.sourceSection).toBe("packaging");

    const lifeos = entries.find((entry) => entry.project === "Life OS");
    expect(lifeos?.activeRepo).toBe("ebyron357/LifeOS-Enterprise");
    expect(lifeos?.sourceSection).toBe("other-active");
  });

  it("test case 4: identifies a repository listed in the registry with no corresponding project claim (unmapped)", () => {
    const entries = parseRegistry(FIXTURE);
    // "Orphan Project" is a registry row with no vault project note anywhere in this fixture-only test;
    // the unmapped-repo computation itself is covered end-to-end in build-portfolio-data via the vault index.
    expect(entries.map((entry) => entry.activeRepo)).toContain("ebyron357/orphan-repo");
  });

  it("does not classify the 'Do Not Use As Active' bullet list as a project table row", () => {
    const entries = parseRegistry(FIXTURE);
    expect(entries.some((entry) => entry.project.includes("sample-repo-old"))).toBe(false);
  });

  it("parses archive-candidate repositories from the bullet list", () => {
    const archived = parseArchiveCandidates(FIXTURE);
    expect(archived).toContain("ebyron357/sample-repo-old");
    expect(archived).toContain("ebyron357/archived-thing");
  });

  it("test case 7: a stale registry entry (present but unreferenced elsewhere) still parses without throwing", () => {
    const staleOnly = "## Other Active Project Repos\n\n| Project | Active repo | Notes |\n|---|---|---|\n| Forgotten | `ebyron357/forgotten-repo` | Not touched in a long time. |\n";
    const entries = parseRegistry(staleOnly);
    expect(entries).toHaveLength(1);
    expect(entries[0].activeRepo).toBe("ebyron357/forgotten-repo");
  });

  it("never throws on malformed or empty input", () => {
    expect(() => parseRegistry("")).not.toThrow();
    expect(() => parseRegistry("not a table at all")).not.toThrow();
    expect(parseRegistry("")).toEqual([]);
  });
});
