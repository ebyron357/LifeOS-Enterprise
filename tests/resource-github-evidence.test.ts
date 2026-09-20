import { Buffer } from "node:buffer";\nimport { describe, expect, it, vi } from "vitest";
import { inspectGitHubRepository } from "@/lib/resource-intelligence/github-evidence";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GitHub Resource Intelligence evidence", () => {
  it("suggests TEMPLATE only when README evidence explicitly supports it", async () => {
    const readme = [
      "# Knowledge Agent Template",
      "Reusable template. Fork it, customize it, and deploy your own agent.",
      "File-system based knowledge search with source sync and isolated sandbox execution.",
    ].join("\n");

    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.endsWith("/repos/vercel-labs/knowledge-agent-template")) {
        return json({
          full_name: "vercel-labs/knowledge-agent-template",
          description: "Open source file-system and knowledge based agent template",
          default_branch: "main",
          archived: false,
          visibility: "public",
          stargazers_count: 100,
          forks_count: 10,
          open_issues_count: 3,
          updated_at: "2026-09-15T08:10:05Z",
          pushed_at: "2026-09-15T08:10:05Z",
          license: { spdx_id: "MIT", name: "MIT License" },
        });
      }
      if (target.includes("/readme?")) {
        return json({ encoding: "base64", content: Buffer.from(readme).toString("base64") });
      }
      if (target.includes("/contents?")) {
        return json([
          { name: "README.md", type: "file" },
          { name: "SECURITY.md", type: "file" },
          { name: "package.json", type: "file" },
          { name: "docs", type: "dir" },
        ]);
      }
      if (target.includes("/commits?")) {
        return json([{ sha: "814711f1cf5632d1", commit: { committer: { date: "2026-09-15T08:10:05Z" } } }]);
      }
      return json({ message: "unexpected" }, 500);
    });

    const result = await inspectGitHubRepository(
      "https://github.com/vercel-labs/knowledge-agent-template",
      { fetcher: fetcher as typeof fetch },
    );

    expect(result.repository).toBe("vercel-labs/knowledge-agent-template");
    expect(result.license).toBe("MIT");
    expect(result.architectureSuggestion).toBe("TEMPLATE");
    expect(result.dispositionSuggestion).toBe("PENDING");
    expect(result.hasSecurityPolicy).toBe(true);
    expect(result.hasArchitectureDocs).toBe(true);
    expect(result.readmeSignals).toMatchObject({
      explicitlyTemplate: true,
      mentionsFileBasedKnowledge: true,
      mentionsSandbox: true,
      mentionsSourceSync: true,
    });
  });

  it("does not invent an architecture classification when README evidence is insufficient", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.endsWith("/repos/example/project")) {
        return json({
          full_name: "example/project",
          default_branch: "main",
          archived: false,
          visibility: "public",
          license: null,
        });
      }
      if (target.includes("/readme?")) {
        return json({ encoding: "base64", content: Buffer.from("# Project\nInternal application.").toString("base64") });
      }
      if (target.includes("/contents?")) return json([{ name: "README.md", type: "file" }]);
      if (target.includes("/commits?")) return json([]);
      return json({}, 500);
    });

    const result = await inspectGitHubRepository("https://github.com/example/project", {
      fetcher: fetcher as typeof fetch,
    });

    expect(result.architectureSuggestion).toBeNull();
    expect(result.dispositionSuggestion).toBe("PENDING");
  });

  it("rejects non-GitHub sources", async () => {
    await expect(inspectGitHubRepository("https://example.com/article")).rejects.toThrow(
      "GitHub repository inspection requires a GitHub repository URL.",
    );
  });
});
