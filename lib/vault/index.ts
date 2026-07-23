import "server-only";

import { cache } from "react";
import { buildVaultIndex } from "./build-index";
import type { SearchFilters, SearchResult, VaultIndex, VaultNote, VaultSection, VaultTask } from "./types";

export const getVaultIndex = cache(async (): Promise<VaultIndex> => buildVaultIndex());

export async function getNoteBySlug(slug: string): Promise<VaultNote | null> {
  const index = await getVaultIndex();
  return index.bySlug[slug] ?? null;
}

export async function getNoteByPath(notePath: string): Promise<VaultNote | null> {
  const index = await getVaultIndex();
  return index.byPath[notePath] ?? index.byPath[`${notePath.replace(/\.md$/i, "")}.md`] ?? null;
}

export async function getNotesBySection(section: VaultSection): Promise<VaultNote[]> {
  const index = await getVaultIndex();
  return index.bySection[section] ?? [];
}

export async function getNotesByType(type: string): Promise<VaultNote[]> {
  const index = await getVaultIndex();
  return index.byType[type] ?? [];
}

export async function getBacklinks(notePath: string): Promise<VaultNote[]> {
  const index = await getVaultIndex();
  const paths = index.backlinks[notePath] ?? [];
  return paths.map((path) => index.byPath[path]).filter(Boolean);
}

export async function getAllTasks(): Promise<VaultTask[]> {
  const index = await getVaultIndex();
  return index.tasks;
}

export function searchVault(index: VaultIndex, query: string, filters: SearchFilters = {}): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const terms = normalized.split(/\s+/).filter(Boolean);

  return index.notes
    .filter((note) => {
      if (filters.section && note.section !== filters.section) return false;
      if (filters.type && note.type !== filters.type) return false;
      if (filters.status && note.status !== filters.status) return false;
      if (filters.tag && !note.tags.includes(filters.tag)) return false;
      if (filters.business && !(note.business ?? "").toLowerCase().includes(filters.business.toLowerCase())) return false;
      return true;
    })
    .map((note) => {
      let score = 0;
      const highlights: string[] = [];
      const title = note.title.toLowerCase();
      const folder = note.folder.toLowerCase();
      const body = note.body.toLowerCase();
      const type = (note.type ?? "").toLowerCase();
      const status = (note.status ?? "").toLowerCase();
      const business = (note.business ?? "").toLowerCase();

      for (const term of terms) {
        if (title.includes(term)) {
          score += 10;
          highlights.push(`Title: ${note.title}`);
        }
        if (folder.includes(term)) score += 4;
        if (type.includes(term)) score += 6;
        if (status.includes(term)) score += 5;
        if (business.includes(term)) score += 6;
        if (note.tags.some((tag) => tag.toLowerCase().includes(term))) score += 7;
        if (note.headings.some((heading) => heading.text.toLowerCase().includes(term))) score += 5;
        if (body.includes(term)) score += 3;
        if (note.excerpt.toLowerCase().includes(term)) score += 2;
      }

      return { note, score, highlights: [...new Set(highlights)] };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.note.title.localeCompare(b.note.title));
}

export async function getSectionCounts(): Promise<Record<VaultSection, number>> {
  const index = await getVaultIndex();
  return {
    overview: 1,
    projects: index.bySection.projects?.length ?? 0,
    tasks: index.tasks.filter((task) => !task.completed).length,
    businesses: index.bySection.businesses?.length ?? 0,
    growth: index.bySection.growth?.length ?? 0,
    intelligence: index.bySection.intelligence?.length ?? 0,
    agents: index.bySection.agents?.length ?? 0,
    resources: index.bySection.resources?.length ?? 0,
    people: index.bySection.people?.length ?? 0,
    learning: index.bySection.learning?.length ?? 0,
    journal: index.bySection.journal?.length ?? 0,
    reviews: index.bySection.reviews?.length ?? 0,
    sops: index.bySection.sops?.length ?? 0,
    templates: index.bySection.templates?.length ?? 0,
    archive: index.bySection.archive?.length ?? 0,
    search: index.noteCount,
  };
}
