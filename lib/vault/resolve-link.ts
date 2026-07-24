import { normalizeVaultPath } from "./exclusions";
import type { VaultLink } from "./types";

function stripExtension(target: string): string {
  return target.replace(/\.md$/i, "");
}

export function resolveVaultTarget(
  target: string,
  sourcePath: string,
  pathIndex: Set<string>,
  basenameIndex: Record<string, string[]>,
): string | null {
  const normalizedTarget = normalizeVaultPath(target.trim());
  if (!normalizedTarget) return null;

  const candidates = new Set<string>();
  const withoutHash = normalizedTarget.split("#")[0];
  const base = stripExtension(withoutHash);

  candidates.add(normalizeVaultPath(withoutHash));
  candidates.add(normalizeVaultPath(`${base}.md`));
  candidates.add(normalizeVaultPath(`${withoutHash}.md`));

  if (!withoutHash.includes("/")) {
    const sourceFolder = sourcePath.includes("/") ? sourcePath.slice(0, sourcePath.lastIndexOf("/")) : "";
    if (sourceFolder) {
      candidates.add(normalizeVaultPath(`${sourceFolder}/${withoutHash}`));
      candidates.add(normalizeVaultPath(`${sourceFolder}/${withoutHash}.md`));
      candidates.add(normalizeVaultPath(`${sourceFolder}/${base}.md`));
    }

    const basenameMatches = basenameIndex[base.toLowerCase()] ?? basenameIndex[withoutHash.toLowerCase()] ?? [];
    basenameMatches.forEach((match) => candidates.add(match));
  }

  for (const candidate of candidates) {
    if (pathIndex.has(candidate)) return candidate;
    const withMd = candidate.endsWith(".md") ? candidate : `${candidate}.md`;
    if (pathIndex.has(withMd)) return withMd;
  }

  return null;
}

export function resolveNoteLinks(
  links: VaultLink[],
  sourcePath: string,
  pathIndex: Set<string>,
  basenameIndex: Record<string, string[]>,
): VaultLink[] {
  return links.map((link) => {
    if (link.external) return link;
    const resolvedPath = resolveVaultTarget(link.target, sourcePath, pathIndex, basenameIndex);
    return { ...link, resolvedPath };
  });
}

export function buildBacklinks(notes: Array<{ path: string; links: VaultLink[]; embeds: VaultLink[] }>) {
  const backlinks: Record<string, string[]> = {};

  for (const note of notes) {
    for (const link of [...note.links, ...note.embeds]) {
      if (!link.resolvedPath) continue;
      if (!backlinks[link.resolvedPath]) backlinks[link.resolvedPath] = [];
      if (!backlinks[link.resolvedPath].includes(note.path)) {
        backlinks[link.resolvedPath].push(note.path);
      }
    }
  }

  return backlinks;
}

export function buildBasenameIndex(paths: string[]): Record<string, string[]> {
  const index: Record<string, string[]> = {};

  for (const filePath of paths) {
    const base = filePath.replace(/\.md$/i, "").split("/").pop()?.toLowerCase() ?? "";
    if (!base) continue;
    if (!index[base]) index[base] = [];
    index[base].push(filePath);
  }

  return index;
}
