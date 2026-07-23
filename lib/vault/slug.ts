import { normalizeVaultPath } from "./exclusions";

/** Stable note identity used in the vault index (decoded path without .md). */
export function pathToSlug(relativePath: string): string {
  return normalizeVaultPath(relativePath).replace(/\.md$/i, "");
}

export function slugToPath(slug: string): string {
  const decoded = slug
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
  return decoded.endsWith(".md") ? decoded : `${decoded}.md`;
}

export function headingToAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Browser href for a vault note path. */
export function noteHref(path: string): string {
  const slug = pathToSlug(path)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/note/${slug}`;
}
