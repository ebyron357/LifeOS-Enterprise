import { Buffer } from "node:buffer";
import { describe, expect, it, vi } from "vitest";
import { collectGitHubSourceEvidence, inspectGitHubRepository } from "@/lib/resource-intelligence/github-evidence";

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
    ].join("\\n");

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
        return json({ encoding: "base64", content: Buffer.from("# Project\\nInternal application.").toString("base64") });
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

  it("collects a write-time evidence snapshot with SPDX license, commit, and counts", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.endsWith("/repos/example/project")) {
        return json({
          full_name: "example/project",
          default_branch: "trunk",
          archived: true,
          visibility: "public",
          stargazers_count: 7,
          forks_count: 2,
          pushed_at: "2026-09-01T00:00:00Z",
          license: { spdx_id: "Apache-2.0", name: "Apache License 2.0" },
        });
      }
      if (target.includes("/readme?")) return json({ encoding: "base64", content: Buffer.from("# Project").toString("base64") });
      if (target.includes("/contents?")) return json([]);
      if (target.includes("/commits?")) return json([{ sha: "abc123def456", commit: { author: { date: "2026-08-31T00:00:00Z" } } }]);
      return json({}, 500);
    });

    const evidence = await collectGitHubSourceEvidence("https://github.com/example/project", {
      fetcher: fetcher as typeof fetch,
      now: () => new Date("2026-09-30T10:00:00.000Z"),
    });

    expect(evidence).toEqual({
      status: "source-evidence-captured",
      inspectedAt: "2026-09-30T10:00:00.000Z",
      processor: "github",
      github: {
        repository: "example/project",
        defaultBranch: "trunk",
        latestCommitSha: "abc123def456",
        latestCommitAt: "2026-08-31T00:00:00Z",
        license: "Apache-2.0",
        stars: 7,
        forks: 2,
        archived: true,
        pushedAt: "2026-09-01T00:00:00Z",
        architectureSuggestion: null,
      },
    });
  });

  it("returns evidence-unavailable with a safe summary instead of throwing", async () => {
    const secret = "ghp_secretTokenValue1234567890";
    const failing = vi.fn(async () => json({ message: `Bad credentials ${secret}` }, 401));
    const unavailable = await collectGitHubSourceEvidence("https://github.com/example/project", {
      fetcher: failing as unknown as typeof fetch,
      token: secret,
      now: () => new Date("2026-09-30T10:00:00.000Z"),
    });
    expect(unavailable).toEqual({
      status: "evidence-unavailable",
      inspectedAt: "2026-09-30T10:00:00.000Z",
      processor: "github",
      error: "GitHub repository metadata request failed (HTTP 401).",
    });

    const network = vi.fn(async () => {
      throw new Error(`connect ECONNREFUSED https://user:${secret}@proxy.internal`);
    });
    const networkFailure = await collectGitHubSourceEvidence("https://github.com/example/project", {
      fetcher: network as unknown as typeof fetch,
    });
    expect(networkFailure).toMatchObject({
      status: "evidence-unavailable",
      error: "GitHub evidence request failed (network or unexpected error).",
    });
    expect(JSON.stringify(networkFailure)).not.toContain(secret);
  });

  it("rejects non-GitHub sources", async () => {
    await expect(inspectGitHubRepository("https://example.com/article")).rejects.toThrow(
      "GitHub repository inspection requires a GitHub repository URL.",
    );
  });
});
