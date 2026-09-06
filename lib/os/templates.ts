import type { VaultNote } from "@/lib/vault/types";

export type TemplateCard = {
  id: string;
  path: string;
  name: string;
  purpose: string;
  preview: string;
};

const PLACEHOLDER = /\{\{[^}]+\}\}/g;

export function humanTemplateName(title: string, path: string): string {
  const fromTitle = title.replace(/\s*template\s*/gi, " ").replace(PLACEHOLDER, "").trim();
  if (fromTitle && !/\{\{[^}]+\}\}/.test(fromTitle)) return fromTitle;
  const file = path.split("/").pop()?.replace(/\.md$/i, "") ?? "Template";
  return file.replace(/[-_]+/g, " ").replace(/\btemplate\b/gi, "").trim() || "Untitled template";
}

export function sanitizeTemplatePreview(text: string): string {
  return text
    .replace(PLACEHOLDER, "")
    .replace(/^---[\s\S]*?---/, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export function catalogTemplates(notes: VaultNote[]): TemplateCard[] {
  return notes.map((note) => {
    const purpose = note.headings.find((heading) => heading.level <= 2)?.text
      || note.excerpt
      || "Reusable note structure for Obsidian.";
    return {
      id: note.path,
      path: note.path,
      name: humanTemplateName(note.title, note.path),
      purpose: sanitizeTemplatePreview(purpose) || "Reusable note structure.",
      preview: sanitizeTemplatePreview(note.excerpt || note.body) || "No preview available.",
    };
  }).filter((card) => card.name.length > 2);
}

export function containsRawPlaceholder(value: string): boolean {
  return /\{\{[^}]+\}\}/.test(value);
}
