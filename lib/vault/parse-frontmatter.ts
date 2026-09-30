export function normalizeNewlines(source: string): string {
  return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Double-quoted scalars are decoded with JSON rules so escaped quotes and backslashes
 * written by LifeOS round-trip exactly; anything else keeps the historical quote strip.
 */
function decodeScalar(raw: string): string {
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
    try {
      const decoded: unknown = JSON.parse(raw);
      if (typeof decoded === "string") return decoded;
    } catch {
      // Not JSON-compatible (for example a YAML-only escape); fall back below.
    }
  }
  return raw.replace(/^['"]|['"]$/g, "");
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

  const lines = block.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!match) continue;

    const key = match[1];

    // YAML block sequence: `key:` followed by `- item` lines (indented or not).
    if (match[2].trim() === "") {
      const items: string[] = [];
      let next = index + 1;
      for (; next < lines.length; next += 1) {
        const item = lines[next].match(/^\s*-\s+(.*)$/);
        if (!item) break;
        const decoded = decodeScalar(item[1].trim());
        if (decoded) items.push(decoded);
      }
      if (next > index + 1) {
        frontmatter[key] = items;
        index = next - 1;
        continue;
      }
    }

    let value: unknown = decodeScalar(match[2].trim());

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
