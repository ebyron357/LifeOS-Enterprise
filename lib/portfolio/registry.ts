import type { RegistryEntry } from "./types";

function splitRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(row: string): boolean {
  return /^\|?[\s:-]+\|/.test(row) && row.replace(/[|:\-\s]/g, "").length === 0;
}

function extractRepoNames(cell: string): string[] {
  const matches = cell.match(/`([^`]+)`/g) ?? [];
  return matches.map((match) => match.replace(/`/g, "").trim()).filter(Boolean);
}

/**
 * Parses PROJECT_REPO_REGISTRY.md's markdown tables into structured
 * RegistryEntry records. Pure text parsing only — never reads from GitHub
 * and never mutates the source file. Unknown/malformed rows are skipped
 * rather than throwing, since this file is hand-edited.
 */
export function parseRegistry(markdown: string): RegistryEntry[] {
  const lines = markdown.split(/\r?\n/);
  const entries: RegistryEntry[] = [];

  let currentSection: RegistryEntry["sourceSection"] = "packaging";
  let inTable = false;
  let headerCells: string[] = [];

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      const text = heading[1].toLowerCase();
      if (text.includes("do not use")) currentSection = "do-not-use";
      else if (text.includes("other active")) currentSection = "other-active";
      else if (text.includes("packaging")) currentSection = "packaging";
      inTable = false;
      headerCells = [];
      continue;
    }

    if (!line.trim().startsWith("|")) {
      inTable = false;
      continue;
    }

    if (isSeparatorRow(line)) continue;

    const cells = splitRow(line);

    if (!inTable) {
      headerCells = cells.map((cell) => cell.toLowerCase());
      inTable = true;
      continue;
    }

    if (currentSection === "do-not-use") continue; // bullet list, not a table, in current file

    const projectIdx = headerCells.findIndex((cell) => cell.includes("project"));
    const repoIdx = headerCells.findIndex((cell) => cell.includes("active repo") || cell.includes("repo"));
    const statusIdx = headerCells.findIndex((cell) => cell === "status");
    const reasonIdx = headerCells.findIndex((cell) => cell.includes("why") || cell.includes("notes"));
    const archiveIdx = headerCells.findIndex((cell) => cell.includes("archive") || cell.includes("reference"));

    const project = projectIdx >= 0 ? cells[projectIdx] : "";
    if (!project) continue;

    const activeRepoCell = repoIdx >= 0 ? cells[repoIdx] : "";
    const activeRepos = extractRepoNames(activeRepoCell);

    entries.push({
      project,
      activeRepo: activeRepos[0] ?? activeRepoCell,
      status: statusIdx >= 0 ? cells[statusIdx] : "",
      reason: reasonIdx >= 0 ? cells[reasonIdx] : "",
      archiveRepos: archiveIdx >= 0 ? extractRepoNames(cells[archiveIdx]) : [],
      sourceSection: currentSection,
    });
  }

  return entries;
}

/**
 * "Do Not Use As Active" bullet list is not a table in the current
 * registry format; parse it separately as archive-candidate repo names.
 */
export function parseArchiveCandidates(markdown: string): string[] {
  const section = markdown.match(/##\s+Do Not Use As Active[\s\S]*?(?=\n##\s|$)/i);
  if (!section) return [];
  const matches = section[0].match(/`([^`]+)`/g) ?? [];
  return [...new Set(matches.map((match) => match.replace(/`/g, "").trim()))].filter((name) => name.includes("/"));
}
