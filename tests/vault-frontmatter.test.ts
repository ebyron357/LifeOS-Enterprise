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
});
