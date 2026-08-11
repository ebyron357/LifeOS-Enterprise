import type { VaultNote } from "@/lib/vault/types";
import { buildPortfolioFromNotes, needsAttention } from "./model";
import { parseArchiveCandidates, parseRegistry } from "./registry";
import type { PortfolioProject, RegistryEntry } from "./types";

export type PortfolioData = {
  projects: PortfolioProject[];
  attention: PortfolioProject[];
  registryEntries: RegistryEntry[];
  archiveCandidates: string[];
  unmappedRepos: string[];
  generatedAt: string;
};

const priorityRank: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Someday: 4 };

/**
 * Pure aggregation with no filesystem or "server-only" dependency, so it is
 * usable from both the Next.js app (via build-portfolio-data.ts) and plain
 * Node CLI scripts (scripts/portfolio/*.ts) without pulling in Next/React
 * request-scoped caching.
 */
export function buildPortfolioSnapshot(notes: VaultNote[], registrySource: string, now: Date): PortfolioData {
  const today = now.toISOString().slice(0, 10);

  const projects = buildPortfolioFromNotes(notes).sort(
    (a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) || a.name.localeCompare(b.name),
  );

  const attention = projects
    .filter((project) => needsAttention(project, today))
    .sort((a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9))
    .slice(0, 3);

  const registryEntries = parseRegistry(registrySource);
  const archiveCandidates = parseArchiveCandidates(registrySource);

  const unmappedRepos = [
    ...new Set(
      registryEntries
        .map((entry) => entry.activeRepo)
        .filter((repo) => repo && !projects.some((project) => project.canonicalRepository === repo)),
    ),
  ];

  return {
    projects,
    attention,
    registryEntries,
    archiveCandidates,
    unmappedRepos,
    generatedAt: now.toISOString(),
  };
}
