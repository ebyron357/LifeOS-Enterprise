import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { isExcludedPath, isIndexableMarkdown, isPrivateFrontmatter } from "./exclusions";
import { frontmatterString, frontmatterTags, parseFrontmatter } from "./parse-frontmatter";
import {
  extractEmbeds,
  extractExcerpt,
  extractHeadings,
  extractMarkdownLinks,
  extractTasks,
  extractTitle,
  extractWikilinks,
} from "./parse-note";
import { buildBacklinks, buildBasenameIndex, resolveNoteLinks } from "./resolve-link";
import { isLegacyPath, mapNoteToSection } from "./section-map";
import { pathToSlug } from "./slug";
import type { VaultIndex, VaultNote, VaultSection, VaultTask } from "./types";

async function walkMarkdownFiles(root: string, relative = ""): Promise<string[]> {
  const absolute = path.join(root, relative);
  let entries: Array<{ name: string; isDirectory: () => boolean }>;

  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    const nextRelative = relative ? `${relative}/${entry.name}` : entry.name;
    if (isExcludedPath(nextRelative)) continue;

    if (entry.isDirectory()) {
      files.push(...await walkMarkdownFiles(root, nextRelative));
      continue;
    }

    if (isIndexableMarkdown(nextRelative)) {
      files.push(nextRelative);
    }
  }

  return files.sort();
}

async function parseVaultNote(root: string, relativePath: string): Promise<{ note: VaultNote | null; error?: string; tasks: VaultTask[] }> {
  try {
    const absolute = path.join(root, relativePath);
    const [source, fileStat] = await Promise.all([readFile(absolute, "utf8"), stat(absolute)]);
    const { frontmatter, body } = parseFrontmatter(source);

    if (isPrivateFrontmatter(frontmatter)) {
      return { note: null, tasks: [] };
    }

    const title = extractTitle(relativePath, body);
    const folder = relativePath.includes("/") ? relativePath.slice(0, relativePath.lastIndexOf("/")) : "";
    const type = frontmatterString(frontmatter.type);
    const status = frontmatterString(frontmatter.status);

    const draft: VaultNote = {
      path: relativePath,
      slug: pathToSlug(relativePath),
      title,
      type,
      status,
      priority: frontmatterString(frontmatter.priority),
      tags: frontmatterTags(frontmatter.tags),
      owner: frontmatterString(frontmatter.owner),
      reviewDate: frontmatterString(frontmatter.review_date),
      nextAction: frontmatterString(frontmatter.next_action),
      blocker: frontmatterString(frontmatter.blocker),
      waitingOn: frontmatterString(frontmatter.waiting_on),
      business: frontmatterString(frontmatter.business),
      area: frontmatterString(frontmatter.area),
      goal: frontmatterString(frontmatter.goal),
      organization: frontmatterString(frontmatter.company) ?? frontmatterString(frontmatter.organization),
      role: frontmatterString(frontmatter.role),
      relationship: frontmatterString(frontmatter.relationship),
      lastContact: frontmatterString(frontmatter.last_contact),
      nextContact: frontmatterString(frontmatter.next_contact),
      created: frontmatterString(frontmatter.created),
      updated: frontmatterString(frontmatter.updated),
      folder,
      section: "resources",
      legacy: isLegacyPath(relativePath),
      excerpt: extractExcerpt(body),
      headings: extractHeadings(body),
      links: [...extractWikilinks(body), ...extractMarkdownLinks(body)],
      embeds: extractEmbeds(body),
      tasks: [],
      body,
      frontmatter,
      modifiedAt: fileStat.mtime.toISOString(),
    };

    draft.section = mapNoteToSection(draft);
    const tasks = extractTasks(body, relativePath, title, frontmatter).map((task) => ({
      ...task,
      section: draft.section,
    }));
    draft.tasks = tasks;

    return { note: draft, tasks };
  } catch (error) {
    return {
      note: null,
      tasks: [],
      error: error instanceof Error ? error.message : "Unknown parse error",
    };
  }
}

export async function buildVaultIndex(root = process.cwd()): Promise<VaultIndex> {
  const markdownPaths = await walkMarkdownFiles(root);
  const notes: VaultNote[] = [];
  const tasks: VaultTask[] = [];
  const errors: VaultIndex["errors"] = [];

  for (const filePath of markdownPaths) {
    const parsed = await parseVaultNote(root, filePath);
    if (parsed.error) errors.push({ path: filePath, message: parsed.error });
    if (parsed.note) notes.push(parsed.note);
    tasks.push(...parsed.tasks);
  }

  // Resolve links only against public/indexable notes so private paths never leak.
  const publicPaths = notes.map((note) => note.path);
  const pathIndex = new Set(publicPaths);
  const basenameIndex = buildBasenameIndex(publicPaths);

  for (const note of notes) {
    note.links = resolveNoteLinks(note.links, note.path, pathIndex, basenameIndex);
    note.embeds = resolveNoteLinks(note.embeds, note.path, pathIndex, basenameIndex);
  }

  const backlinks = buildBacklinks(notes);
  const byPath: Record<string, VaultNote> = {};
  const bySlug: Record<string, VaultNote> = {};
  const byType: Record<string, VaultNote[]> = {};
  const byTag: Record<string, VaultNote[]> = {};
  const byFolder: Record<string, VaultNote[]> = {};
  const bySection = {} as Record<VaultSection, VaultNote[]>;

  for (const note of notes) {
    byPath[note.path] = note;
    bySlug[note.slug] = note;

    if (note.type) {
      if (!byType[note.type]) byType[note.type] = [];
      byType[note.type].push(note);
    }

    for (const tag of note.tags) {
      if (!byTag[tag]) byTag[tag] = [];
      byTag[tag].push(note);
    }

    if (!byFolder[note.folder]) byFolder[note.folder] = [];
    byFolder[note.folder].push(note);

    if (!bySection[note.section]) bySection[note.section] = [];
    bySection[note.section].push(note);
  }

  return {
    builtAt: new Date().toISOString(),
    noteCount: notes.length,
    notes,
    byPath,
    bySlug,
    byType,
    byTag,
    byFolder,
    bySection,
    backlinks,
    basenameIndex,
    tasks,
    errors,
  };
}
