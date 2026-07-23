import { describe, expect, it } from "vitest";
import { extractTasks, extractWikilinks, preprocessMarkdownBody } from "@/lib/vault/parse-note";

describe("note parsing", () => {
  it("extracts tasks with due dates", () => {
    const body = "- [ ] Finish portal 📅 2026-08-01\n- [x] Done task\n";
    const tasks = extractTasks(body, "Projects/Test.md", "Test", { priority: "P1" });
    expect(tasks).toHaveLength(2);
    expect(tasks[0].dueDate).toBe("2026-08-01");
    expect(tasks[1].completed).toBe(true);
  });

  it("extracts wikilinks and converts them for markdown rendering", () => {
    const body = "See [[Projects/LifeOS Enterprise|LifeOS]] and [[Missing]].";
    const links = extractWikilinks(body);
    expect(links[0].alias).toBe("LifeOS");
    expect(preprocessMarkdownBody(body)).toContain("wiki:Projects/LifeOS Enterprise");
  });
});
