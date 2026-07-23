import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildVaultIndex } from "@/lib/vault/build-index";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => import("node:fs/promises").then((fs) => fs.rm(dir, { recursive: true, force: true }))));
});

async function makeFixture(notes: Record<string, string>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "lifeos-vault-"));
  tempDirs.push(dir);

  for (const [relative, content] of Object.entries(notes)) {
    const absolute = path.join(dir, relative);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content, "utf8");
  }

  return dir;
}

describe("vault index", () => {
  it("indexes nested folders and builds backlinks", async () => {
    const root = await makeFixture({
      "10 Projects/Alpha.md": "---\ntype: project\nstatus: active\npriority: P0\nnext_action: Ship\nreview_date: 2026-08-01\n---\n# Alpha\nSee [[10 Projects/Beta]].\n",
      "10 Projects/Beta.md": "---\ntype: project\nstatus: active\npriority: P1\nnext_action: Review\nreview_date: 2026-08-02\n---\n# Beta\n",
      ".env": "SECRET=1\n",
      "app/page.tsx": "export default function Page() { return null; }\n",
    });

    const index = await buildVaultIndex(root);
    expect(index.noteCount).toBe(2);
    expect(index.byPath["10 Projects/Alpha.md"].links[0].resolvedPath).toBe("10 Projects/Beta.md");
    expect(index.backlinks["10 Projects/Beta.md"]).toContain("10 Projects/Alpha.md");
    expect(index.byPath[".env"]).toBeUndefined();
  });

  it("skips private notes and continues on malformed frontmatter", async () => {
    const root = await makeFixture({
      "01 Inbox/Private.md": "---\nprivate: true\n---\n# Hidden\n",
      "01 Inbox/Public.md": "---\ntype: resource\nstatus: active\n---\nBroken but readable\n",
    });

    const index = await buildVaultIndex(root);
    expect(index.noteCount).toBe(1);
    expect(index.byPath["01 Inbox/Public.md"].title).toBe("Public");
  });

  it("does not resolve wikilinks to private notes", async () => {
    const root = await makeFixture({
      "01 Inbox/Public.md": "---\ntype: resource\nstatus: active\n---\n# Public\nSee [[01 Inbox/Secret]].\n",
      "01 Inbox/Secret.md": "---\nprivate: true\n---\n# Secret\n",
    });

    const index = await buildVaultIndex(root);
    expect(index.noteCount).toBe(1);
    expect(index.byPath["01 Inbox/Secret.md"]).toBeUndefined();
    expect(index.byPath["01 Inbox/Public.md"].links[0].resolvedPath).toBeNull();
  });


  it("handles duplicate note names via full paths", async () => {
    const root = await makeFixture({
      "Projects/Duplicate.md": "---\ntype: project\nstatus: active\npriority: P2\nnext_action: Legacy\nreview_date: 2026-08-01\n---\n# Legacy Duplicate\n",
      "10 Projects/Duplicate.md": "---\ntype: project\nstatus: active\npriority: P0\nnext_action: Canonical\nreview_date: 2026-08-01\n---\n# Canonical Duplicate\n",
    });

    const index = await buildVaultIndex(root);
    expect(index.basenameIndex.duplicate?.length).toBe(2);
    expect(index.byPath["Projects/Duplicate.md"].nextAction).toBe("Legacy");
    expect(index.byPath["10 Projects/Duplicate.md"].nextAction).toBe("Canonical");
  });
});
