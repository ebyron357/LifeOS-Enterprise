export function normalizeNewlines(source: string): string {
  return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function parseFrontmatter(source: string): { frontmatter: Record<string, unknown>; body: string } {
  const text = normalizeNewlines(source);
  if (!text.startsWith("---\n")) {
    return { frontmatter: {}, body: text };
  }

  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    return { frontmatter: {}, body: text };
  }

  const frontmatter: Record<string, unknown> = {};
  const block = text.slice(4, end);

  for (const line of block.split("\n")) {
    const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value: unknown = match[2].trim().replace(/^['"]|['"]$/g, "");

    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body: text.slice(end + 4).replace(/^\n/, "") };
}

export function frontmatterString(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function frontmatterTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value) return [value];
  return [];
}
