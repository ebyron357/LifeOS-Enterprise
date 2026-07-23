import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NoteMarkdown } from "@/components/vault/NoteMarkdown";
import type { VaultNote } from "@/lib/vault/types";

function makeNote(overrides: Partial<VaultNote> = {}): VaultNote {
  return {
    path: "10 Projects/Alpha.md",
    slug: "10 Projects/Alpha",
    title: "Alpha",
    type: "project",
    status: "active",
    priority: "P0",
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
    folder: "10 Projects",
    section: "projects",
    legacy: false,
    excerpt: "",
    headings: [],
    links: [
      {
        raw: "[[Beta]]",
        target: "Beta",
        alias: null,
        heading: null,
        resolvedPath: "10 Projects/Beta.md",
        external: false,
      },
    ],
    embeds: [],
    tasks: [],
    body: "See [[Beta]] and [[Missing]].\n\n| Col |\n| --- |\n| A |\n",
    frontmatter: {},
    modifiedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("NoteMarkdown", () => {
  it("links basename wikilinks through resolved paths and marks unresolved targets", () => {
    render(<NoteMarkdown note={makeNote()} />);

    const resolved = screen.getByRole("link", { name: "Beta" });
    expect(resolved.getAttribute("href")).toBe("/note/10%20Projects/Beta");
    expect(screen.getByText("Missing")).toHaveClass("unresolved-link");
  });

  it("renders GFM tables without crashing on mixed markdown", () => {
    const { container } = render(<NoteMarkdown note={makeNote()} />);
    expect(container.querySelector("table")).not.toBeNull();
  });
});
