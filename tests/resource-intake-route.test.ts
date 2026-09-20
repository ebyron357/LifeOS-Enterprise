import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/lifeos/resource-intake/route";

const routeSource = readFileSync(path.join(process.cwd(), "app/api/lifeos/resource-intake/route.ts"), "utf8");

function request(secret = "test-secret") {
  return new Request("https://lifeos.example/api/lifeos/resource-intake", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      Origin: "https://lifeos.example",
    },
    body: JSON.stringify({
      source: "https://github.com/vercel-labs/knowledge-agent-template",
      title: "Knowledge Agent Template",
      captureChannel: "test",
    }),
  });
}

describe("Resource Intelligence intake route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("truthfully reports the current foundation boundaries", async () => {
    const response = await GET();
    const result = await response.json();

    expect(result.mode).toBe("draft-pr-only");
    expect(result.directMainWrites).toBe(false);
    expect(result.capabilities).toMatchObject({
      exactIdentityDedupe: true,
      canonicalResourceRecord: true,
      semanticDedupe: false,
      sourceProcessors: false,
      assetFactory: false,
      automaticDisposition: false,
    });
  });

  it("fails closed while canonical writes are disabled", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "false");
    const githubFetch = vi.fn();
    vi.stubGlobal("fetch", githubFetch);

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("rejects the wrong owner secret before GitHub access", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "correct-secret");
    vi.stubEnv("LIFEOS_GITHUB_TOKEN", "server-only-token");
    const githubFetch = vi.fn();
    vi.stubGlobal("fetch", githubFetch);

    const response = await POST(request("wrong-secret"));

    expect(response.status).toBe(401);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("creates a draft PR for a new canonical resource and never writes main directly", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
    vi.stubEnv("LIFEOS_WRITE_SECRET", "test-secret");
    vi.stubEnv("LIFEOS_GITHUB_TOKEN", "server-only-token");

    const githubFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const target = String(url);
      const method = init?.method ?? "GET";

      if (target.includes("/contents/") && method === "GET") {
        return new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
      }
      if (target.includes("/git/ref/heads/main") && method === "GET") {
        return new Response(JSON.stringify({ object: { sha: "base-sha" } }), { status: 200 });
      }
      if (target.endsWith("/git/refs") && method === "POST") {
        return new Response(JSON.stringify({ ref: "created" }), { status: 201 });
      }
      if (target.includes("/contents/") && method === "PUT") {
        return new Response(JSON.stringify({ content: { sha: "new-sha" } }), { status: 201 });
      }
      if (target.endsWith("/pulls") && method === "POST") {
        return new Response(JSON.stringify({ number: 66, html_url: "https://github.com/example/pull/66" }), { status: 201 });
      }
      return new Response(JSON.stringify({ message: "Unexpected request" }), { status: 500 });
    });
    vi.stubGlobal("fetch", githubFetch);

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      ok: true,
      duplicate: false,
      dedupe: "new-identity",
      pullRequest: { number: 66, draft: true },
      boundaries: {
        architectureClassification: "PENDING",
        disposition: "PENDING",
        semanticDedupe: false,
      },
    });

    const pullCall = githubFetch.mock.calls.find(([url]) => String(url).endsWith("/pulls"));
    expect(pullCall).toBeTruthy();
    const pullBody = JSON.parse(String(pullCall?.[1]?.body));
    expect(pullBody.draft).toBe(true);
    expect(pullBody.base).toBe("main");
    expect(pullBody.head).not.toBe("main");
  });

  it("contains explicit draft-PR guardrails in the route implementation", () => {
    expect(routeSource).toContain('draft: true');
    expect(routeSource).toContain('base: BASE');
    expect(routeSource).toContain('directMainWrites: false');
    expect(routeSource).not.toContain('branch: BASE');
  });
});
