import type { VaultNote } from "@/lib/vault/types";

function stringField(frontmatter: Record<string, unknown>, key: string): string {
  const value = frontmatter[key];
  return typeof value === "string" ? value.replace(/\[\[|\]\]/g, "").trim() : "";
}

export function projectRecordedContext(note: VaultNote) {
  return {
    repository: stringField(note.frontmatter, "repository") || stringField(note.frontmatter, "github"),
    clickup: stringField(note.frontmatter, "clickup"),
    slack: stringField(note.frontmatter, "slack"),
    deployment: stringField(note.frontmatter, "deployment") || stringField(note.frontmatter, "vercel"),
    lastVerified: note.updated || note.modifiedAt || note.reviewDate || "",
  };
}

export function isProjectNote(note: Pick<VaultNote, "type" | "section">): boolean {
  return note.type === "project" || note.section === "projects";
}
