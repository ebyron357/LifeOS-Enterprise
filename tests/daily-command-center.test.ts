import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

async function commandCenter() {
  return readFile(path.join(process.cwd(), "Command Center", "Daily Command Center.md"), "utf8");
}

describe("Daily Command Center queries", () => {
  it("supports canonical due_date and legacy deadline metadata", async () => {
    const source = await commandCenter();

    expect(source).toContain('default(due_date, deadline) AS "Deadline"');
    expect(source).toContain("AND (due_date OR deadline)");
    expect(source).toContain("SORT default(due_date, deadline) ASC");
  });

  it("excludes canonical and legacy inbox index notes", async () => {
    const source = await commandCenter();

    expect(source).toContain('FROM "01 Inbox" OR "Inbox"');
    expect(source).toContain('lower(file.name) != "readme"');
    expect(source).toContain('lower(file.name) != "inbox"');
  });
});
