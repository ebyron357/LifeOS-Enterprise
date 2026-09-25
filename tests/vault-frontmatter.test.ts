import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "@/lib/vault/parse-frontmatter";

describe("frontmatter parsing", () => {
  it("parses CRLF frontmatter and scalar values", () => {
    const source = "---\r\ntype: project\r\nstatus: active\r\npriority: P0\r\n---\r\n# Title\r\n";
    const { frontmatter, body } = parseFrontmatter(source);
    expect(frontmatter.type).toBe("project");
    expect(frontmatter.status).toBe("active");
    expect(body.startsWith("# Title")).toBe(true);
  });

  it("returns empty frontmatter for malformed blocks without crashing", () => {
    const { frontmatter, body } = parseFrontmatter("# No frontmatter");
    expect(frontmatter).toEqual({});
    expect(body).toContain("No frontmatter");
  });

  it("decodes JSON-escaped double-quoted scalars and keeps legacy quoting", () => {
    const source = [
      "---",
      'title: "Resume: \\"alpha\\" plan"',
      "note: 'single quoted'",
      'path: "C:\\\\vault"',
      'flag: "true"',
      'bad: "unterminated \\q"',
      "---",
      "",
    ].join("\n");
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter.title).toBe('Resume: "alpha" plan');
    expect(frontmatter.note).toBe("single quoted");
    expect(frontmatter.path).toBe("C:\\vault");
    expect(frontmatter.flag).toBe(true);
    expect(frontmatter.bad).toBe("unterminated \\q");
  });
});
