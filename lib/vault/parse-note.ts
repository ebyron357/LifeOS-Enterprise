import { headingToAnchor } from "./slug";
import type { VaultLink, VaultTask } from "./types";

const WIKILINK = /(?<!!)\[\[([^\]]+)\]\]/g;
const EMBED = /!\[\[([^\]]+)\]\]/g;
const MARKDOWN_LINK = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;
const HEADING = /^(#{1,6})\s+(.+)$/gm;

export function extractTitle(path: string, body: string): string {
  const heading = body.match(/^#\s+(.+)$/m);
  if (heading?.[1]) return heading[1].trim();
  return path.split("/").pop()?.replace(/\.md$/i, "") ?? path;
}

export function extractHeadings(body: string) {
  return [...body.matchAll(HEADING)].map((match) => ({
    level: match[1].length,
    text: match[2].trim(),
    anchor: headingToAnchor(match[2].trim()),
  }));
}

export function parseWikiTarget(raw: string): Pick<VaultLink, "target" | "alias" | "heading"> {
  const [targetPart, alias] = raw.includes("|") ? raw.split("|", 2) : [raw, null];
  const [target, heading] = targetPart.split("#", 2);
  return {
    target: target.trim(),
    alias: alias?.trim() ?? null,
    heading: heading?.trim() ?? null,
  };
}

export function extractWikilinks(body: string): VaultLink[] {
  return [...body.matchAll(WIKILINK)].map((match) => {
    const parsed = parseWikiTarget(match[1]);
    return {
      raw: match[0],
      ...parsed,
      resolvedPath: null,
      external: false,
    };
  });
}

export function extractEmbeds(body: string): VaultLink[] {
  return [...body.matchAll(EMBED)].map((match) => {
    const parsed = parseWikiTarget(match[1]);
    return {
      raw: match[0],
      ...parsed,
      resolvedPath: null,
      external: false,
    };
  });
}

export function extractMarkdownLinks(body: string): VaultLink[] {
  return [...body.matchAll(MARKDOWN_LINK)].map((match) => {
    const href = match[2].trim();
    const external = /^[a-z][a-z0-9+.-]*:/i.test(href);
    return {
      raw: match[0],
      target: href,
      alias: match[1] || null,
      heading: null,
      resolvedPath: external ? null : href,
      external,
    };
  });
}

export function extractExcerpt(body: string): string {
  const lines = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#+\s+.*/gm, "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith(">") && !line.startsWith("- ["));

  return lines.slice(0, 3).join(" ").slice(0, 220);
}

export function extractTasks(
  body: string,
  sourcePath: string,
  sourceTitle: string,
  meta: Record<string, unknown>,
): VaultTask[] {
  const tasks: VaultTask[] = [];
  const lines = body.split("\n");

  lines.forEach((line, index) => {
    const match = line.match(/^(\s*)- \[( |x|X)\]\s+(.+)$/);
    if (!match) return;

    const text = match[3];
    const due = text.match(/📅\s*(\d{4}-\d{2}-\d{2})/);
    const priority = text.match(/⏫|🔼|🔽|@([Pp][0-3])/);

    tasks.push({
      id: `${sourcePath}:${index + 1}`,
      text: text.replace(/📅\s*\d{4}-\d{2}-\d{2}/g, "").replace(/[⏫🔼🔽]/g, "").trim(),
      completed: match[2].toLowerCase() === "x",
      dueDate: due?.[1] ?? null,
      priority: priority?.[1]?.toUpperCase() ?? (meta.priority ? String(meta.priority) : null),
      sourcePath,
      sourceTitle,
      line: index + 1,
      project: typeof meta.project === "string" ? meta.project : null,
      area: typeof meta.area === "string" ? meta.area : null,
      section: "tasks",
    });
  });

  return tasks;
}

export function preprocessMarkdownBody(body: string): string {
  return body
    .replace(EMBED, (_match, inner: string) => {
      const parsed = parseWikiTarget(inner);
      const label = parsed.alias ?? parsed.target;
      return `\n> **Embed:** [${label}](${parsed.target})\n`;
    })
    .replace(WIKILINK, (_match, inner: string) => {
      const parsed = parseWikiTarget(inner);
      const label = parsed.alias ?? parsed.target;
      const suffix = parsed.heading ? `#${parsed.heading}` : "";
      return `[${label}](wiki:${parsed.target}${suffix})`;
    });
}
