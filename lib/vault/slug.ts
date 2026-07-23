import { normalizeVaultPath } from "./exclusions";

export function pathToSlug(relativePath: string): string {
  const normalized = normalizeVaultPath(relativePath).replace(/\.md$/i, "");
  return normalized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function slugToPath(slug: string): string {
  const decoded = slug
    .split("/")
    .map((segment) => decodeURIComponent(segment))
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

export function noteHref(path: string): string {
  return `/note/${pathToSlug(path)}`;
}
