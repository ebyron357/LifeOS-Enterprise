import { describe, expect, it } from "vitest";
import { catalogTemplates, containsRawPlaceholder, humanTemplateName, sanitizeTemplatePreview } from "@/lib/os/templates";
import type { VaultNote } from "@/lib/vault/types";

function note(partial: Partial<VaultNote> & Pick<VaultNote, "path" | "title">): VaultNote {
  return {
    slug: partial.path,
    type: "template",
    status: null,
    priority: null,
    tags: [],
    owner: null,
    reviewDate: null,
    nextAction: null,
    blocker: null,
    waitingOn: null,
    business: null,
    area: null,
    goal: null,
    organization: null,
    role: null,
    relationship: null,
    lastContact: null,
    nextContact: null,
    created: null,
    updated: null,
    folder: "99 Templates",
    section: "templates",
    legacy: false,
    excerpt: "{{title}} daily note",
    headings: [{ level: 1, text: "{{title}}", anchor: "title" }],
    links: [],
    embeds: [],
    tasks: [],
    body: "# {{title}}\nWrite here.",
    frontmatter: {},
    modifiedAt: null,
    ...partial,
  };
}

describe("template catalog", () => {
  it("never shows raw placeholder tokens in names or previews", () => {
    const cards = catalogTemplates([note({ path: "99 Templates/Daily Note.md", title: "{{title}}" })]);
    expect(cards[0].name).toBe("Daily Note");
    expect(containsRawPlaceholder(cards[0].name)).toBe(false);
    expect(containsRawPlaceholder(cards[0].purpose)).toBe(false);
    expect(containsRawPlaceholder(cards[0].preview)).toBe(false);
    expect(sanitizeTemplatePreview("Hello {{title}} world")).toBe("Hello world");
    expect(humanTemplateName("Project Template {{title}}", "99 Templates/Project.md")).toBe("Project");
  });
});
