import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/lifeos/resource-review/route";
import { normalizeResource, renderResourceRecord, resourceRecordPath } from "@/lib/resource-intelligence/model";

const routeSource = readFileSync(path.join(process.cwd(), "app/api/lifeos/resource-review/route.ts"), "utf8");

const input = { source: "https://github.com/vercel-labs/knowledge-agent-template", title: "Knowledge Agent Template" };
const resource = normalizeResource(input);
const recordPath = resourceRecordPath(resource);
const record = renderResourceRecord(input, resource, "2026-09-20T10:00:00.000Z");

function request(body: unknown, secret = "test-secret") {
  return new Request("https://lifeos.example/api/lifeos/resource-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      Origin: "https://lifeos.example",
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  path: recordPath,
  decision: {
    architectureClassification: "TEMPLATE",
    disposition: "ADAPT",
    rationale: "README explicitly describes a reusable template that overlaps vault indexing.",
  },
};

function enableWrites() {
  vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
  vi.stubEnv("LIFEOS_WRITE_SECRET", "test-secret");
  vi.stubEnv("LIFEOS_GITHUB_TOKEN", "server-only-token");
}

function githubMock(existing: string | null = record) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const target = String(url);
    const method = init?.method ?? "GET";
    if (target.includes("/contents/") && method === "GET") {
      return existing === null
        ? new Response(JSON.stringify({ message: "Not Found" }), { status: 404 })
        : new Response(JSON.stringify({ sha: "record-sha", content: Buffer.from(existing).toString("base64") }), { status: 200 });
    }
    if (target.includes("/git/ref/heads/main") && method === "GET") {
      return new Response(JSON.stringify({ object: { sha: "base-sha" } }), { status: 200 });
    }
    if (target.endsWith("/git/refs") && method === "POST") return new Response("{}", { status: 201 });
    if (target.includes("/contents/") && method === "PUT") return new Response("{}", { status: 200 });
    if (target.endsWith("/pulls") && method === "POST") {
      return new Response(JSON.stringify({ number: 71, html_url: "https://github.com/example/pull/71" }), { status: 201 });
    }
    return new Response(JSON.stringify({ message: "Unexpected request" }), { status: 500 });
  });
}

describe("Resource review route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports owner-only disposition boundaries", async () => {
    const result = await (await GET()).json();
    expect(result).toMatchObject({
      mode: "draft-pr-only",
      directMainWrites: false,
      capabilities: { ownerReviewedDisposition: true, automaticDisposition: false, autoImplementation: false },
    });
    expect(result.dispositions).not.toContain("PENDING");
  });

  it("fails closed while writes are disabled", async () => {
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "false");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await POST(request(validBody))).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects the wrong owner secret before GitHub access", async () => {
    enableWrites();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await POST(request(validBody, "wrong"))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-record paths and invalid decisions before GitHub access", async () => {
    enableWrites();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await POST(request({ ...validBody, path: "10 Projects/plan.md" }))).status).toBe(400);
    expect((await POST(request({ ...validBody, decision: { disposition: "PENDING", rationale: "no decision here" } }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects null, array, and oversized bodies with structured errors before GitHub access", async () => {
    enableWrites();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await POST(request(null))).status).toBe(400);
    expect((await POST(request([validBody]))).status).toBe(400);

    // Oversized body without a trustworthy Content-Length header is still rejected.
    const huge = new Request("https://lifeos.example/api/lifeos/resource-review", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-secret", Origin: "https://lifeos.example" },
      body: JSON.stringify({ ...validBody, padding: "x".repeat(40_000) }),
    });
    huge.headers.delete("content-length");
    const response = await POST(huge);
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gives concurrent submissions for the same record distinct branches", async () => {
    enableWrites();
    const fetchMock = githubMock();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(Date, "now").mockReturnValue(1_790_000_000_000);

    await Promise.all([POST(request(validBody)), POST(request(validBody))]);

    const refs = fetchMock.mock.calls
      .filter(([url, init]) => String(url).endsWith("/git/refs") && init?.method === "POST")
      .map(([, init]) => JSON.parse(String(init?.body)).ref);
    expect(refs).toHaveLength(2);
    expect(new Set(refs).size).toBe(2);
    vi.restoreAllMocks();
  });

  it("returns 404 when the record is not on main", async () => {
    enableWrites();
    vi.stubGlobal("fetch", githubMock(null));
    expect((await POST(request(validBody))).status).toBe(404);
  });

  it("stages the owner decision as a draft PR against main", async () => {
    enableWrites();
    const fetchMock = githubMock();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request(validBody));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      ok: true,
      previousDisposition: "PENDING",
      decision: { disposition: "ADAPT", architectureClassification: "TEMPLATE" },
      pullRequest: { number: 71, draft: true },
    });

    const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
    const putBody = JSON.parse(String(put?.[1]?.body));
    expect(putBody.branch).not.toBe("main");
    expect(putBody.sha).toBe("record-sha");
    expect(Buffer.from(putBody.content, "base64").toString("utf8")).toContain('disposition: "ADAPT"');

    const pull = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/pulls"));
    const pullBody = JSON.parse(String(pull?.[1]?.body));
    expect(pullBody).toMatchObject({ draft: true, base: "main" });
    expect(pullBody.head).toMatch(/^lifeos\/resource-review-/);
  });

  it("returns 409 instead of overwriting an already-reviewed record without revise", async () => {
    enableWrites();
    const reviewed = record.replace('disposition: "PENDING"', 'disposition: "WATCH"');
    vi.stubGlobal("fetch", githubMock(reviewed));
    expect((await POST(request(validBody))).status).toBe(409);
  });

  it("keeps explicit draft-PR guardrails in the implementation", () => {
    expect(routeSource).toContain("draft: true");
    expect(routeSource).toContain("base: BASE");
    expect(routeSource).toContain("directMainWrites: false");
    expect(routeSource).not.toContain("branch: BASE");
  });
});
