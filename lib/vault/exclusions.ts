import path from "node:path";

/** Canonical paths and patterns excluded from the web vault portal. */
export const EXCLUDED_PATH_PREFIXES = [
  ".git/",
  ".github/",
  ".obsidian/",
  ".vercel/",
  ".next/",
  "node_modules/",
  ".local-backups/",
  ".cline/",
  ".codex/",
  ".clinerules/",
  "integrations/",
  "coverage/",
  "out/",
  "app/",
  "components/",
  "lib/",
  "tests/",
  "scripts/",
] as const;

export const EXCLUDED_PATH_EXACT = new Set([
  ".env",
  ".env.example",
  ".env.local",
  ".env.production",
  ".gitignore",
  "package-lock.json",
]);

export const EXCLUDED_FILE_EXTENSIONS = new Set([
  ".pem",
  ".key",
  ".p12",
  ".pfx",
  ".crt",
  ".env",
]);

export const PRIVATE_DIRECTORY_MARKERS = ["private", ".private"] as const;

export function normalizeVaultPath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

export function isExcludedPath(relativePath: string): boolean {
  const normalized = normalizeVaultPath(relativePath);
  const lower = normalized.toLowerCase();

  if (!normalized || EXCLUDED_PATH_EXACT.has(normalized) || EXCLUDED_PATH_EXACT.has(lower)) {
    return true;
  }

  if (lower.startsWith(".env") || lower.includes("/.env")) {
    return true;
  }

  const extension = path.extname(normalized).toLowerCase();
  if (EXCLUDED_FILE_EXTENSIONS.has(extension)) {
    return true;
  }

  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (lower === prefix.slice(0, -1) || lower.startsWith(prefix)) {
      return true;
    }
  }

  const segments = normalized.split("/");
  if (segments.some((segment) => PRIVATE_DIRECTORY_MARKERS.includes(segment.toLowerCase() as typeof PRIVATE_DIRECTORY_MARKERS[number]))) {
    return true;
  }

  return false;
}

export function isPrivateFrontmatter(frontmatter: Record<string, unknown>): boolean {
  const publish = frontmatter.publish;
  const isPrivate = frontmatter.private;
  const visibility = String(frontmatter.web_visibility ?? frontmatter.visibility ?? "").toLowerCase();

  if (publish === false || publish === "false") return true;
  if (isPrivate === true || isPrivate === "true") return true;
  if (visibility === "private" || visibility === "hidden") return true;

  return false;
}

export function isIndexableMarkdown(relativePath: string): boolean {
  const normalized = normalizeVaultPath(relativePath);
  if (!normalized.endsWith(".md")) return false;
  if (isExcludedPath(normalized)) return false;
  if (normalized.endsWith("/README.md") && normalized.split("/").length > 1) {
    return true;
  }
  return true;
}

export function isAttachmentPath(relativePath: string): boolean {
  const normalized = normalizeVaultPath(relativePath);
  if (isExcludedPath(normalized)) return false;

  const allowedRoots = [
    "40 Resources/Attachments/",
    "40 Resources/",
  ];

  const lower = normalized.toLowerCase();
  const extension = path.extname(normalized).toLowerCase();
  const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".pdf"]);

  if (!imageExtensions.has(extension)) return false;
  return allowedRoots.some((root) => lower.startsWith(root.toLowerCase()));
}
