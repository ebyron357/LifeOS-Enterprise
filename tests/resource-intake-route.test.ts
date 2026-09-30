import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/lifeos/resource-intake/route";
import { resourceIntakeBranchPrefix } from "@/lib/github/draft-pr";
import { normalizeResource, resourceRecordPath } from "@/lib/resource-intelligence/model";

const routeSource = readFileSync(path.join(process.cwd(), "app/api/lifeos/resource-intake/route.ts"), "utf8");

const VAULT = "/repos/ebyron357/LifeOS-Enterprise";
const CANDIDATE = "/repos/vercel-labs/knowledge-agent-template";
const SOURCE = "https://github.com/vercel-labs/knowledge-agent-template";
const TOKEN = "server-only-token-ghp_do_not_leak";

let requestCounter = 0;

function request(body: Record<string, unknown> = {}, secret = "test-secret") {
  requestCounter += 1;
  return new Request("https://lifeos.example/api/lifeos/resource-intake", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      Origin: "https://lifeos.example",
      // Distinct client identity per request so the intake rate limit never trips inside the suite.
      "User-Agent": `vitest-resource-intake-${requestCounter}`,
    },
    body: JSON.stringify({
      source: SOURCE,
      title: "Knowledge Agent Template",
      captureChannel: "test",
      ...body,
    }),
  });
}

function enableWrites() {
  vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
  vi.stubEnv("LIFEOS_WRITE_SECRET", "test-secret");
  vi.stubEnv("LIFEOS_GITHUB_TOKEN", TOKEN);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

type StoredFile = { sha: string; content: string };
type FakePull = { number: number; state: "open" | "closed"; draft: boolean; head: string; html_url: string };
type Override = (method: string, pathname: string, url: URL) => Response | null | undefined;

const README = [
  "# Knowledge Agent Template",
  "Reusable template. Fork it, customize it, and deploy your own agent.",
].join("\n");

/** In-memory GitHub: the vault repository (branches, files, pull requests) plus a public candidate repository. */
function fakeGitHub(options: { override?: Override; mainFiles?: Record<string, string>; branches?: string[]; openPulls?: FakePull[] } = {}) {
  let shaCounter = 0;
  let pullCounter = 100;
  const branches = new Map<string, Map<string, StoredFile>>();
  const main = new Map<string, StoredFile>();
  for (const [filePath, content] of Object.entries(options.mainFiles ?? {})) {
    main.set(filePath, { sha: `main-sha-${(shaCounter += 1)}`, content });
  }
  branches.set("main", main);
  for (const branch of options.branches ?? []) branches.set(branch, new Map(main));
  const pulls: FakePull[] = [...(options.openPulls ?? [])];
  const calls: Array<{ method: string; pathname: string; body: Record<string, unknown> | null }> = [];

  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = (init?.method ?? "GET").toUpperCase();
    const pathname = decodeURIComponent(url.pathname);
    const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : null;
    calls.push({ method, pathname, body });

    const overridden = options.override?.(method, pathname, url);
    if (overridden) return overridden;

    if (pathname === CANDIDATE && method === "GET") {
      return json({
        full_name: "vercel-labs/knowledge-agent-template",
        default_branch: "main",
        archived: false,
        visibility: "public",
        stargazers_count: 120,
        forks_count: 12,
        pushed_at: "2026-09-15T08:10:05Z",
        license: { spdx_id: "MIT", name: "MIT License" },
      });
    }
    if (pathname === `${CANDIDATE}/readme`) return json({ encoding: "base64", content: Buffer.from(README).toString("base64") });
    if (pathname === `${CANDIDATE}/contents`) return json([{ name: "README.md", type: "file" }]);
    if (pathname === `${CANDIDATE}/commits`) {
      return json([{ sha: "814711f1cf5632d1a2b3c4d5e6f7a8b9c0d1e2f3", commit: { committer: { date: "2026-09-15T08:10:05Z" } } }]);
    }

    if (pathname.startsWith(`${VAULT}/contents/`)) {
      const filePath = pathname.slice(`${VAULT}/contents/`.length);
      if (method === "GET") {
        const file = branches.get(url.searchParams.get("ref") ?? "main")?.get(filePath);
        return file
          ? json({ sha: file.sha, content: Buffer.from(file.content).toString("base64") })
          : json({ message: "Not Found" }, 404);
      }
      if (method === "PUT") {
        const branch = String(body?.branch ?? "");
        if (!branch || branch === "main") throw new Error("Test failure: intake attempted to write main.");
        const files = branches.get(branch);
        if (!files) return json({ message: "Branch not found" }, 404);
        const current = files.get(filePath);
        if (current && body?.sha !== current.sha) return json({ message: "sha does not match" }, 409);
        if (!current && body?.sha) return json({ message: "sha supplied for a new file" }, 422);
        const next = { sha: `blob-${(shaCounter += 1)}`, content: Buffer.from(String(body?.content), "base64").toString("utf8") };
        files.set(filePath, next);
        return json({ content: { sha: next.sha } }, current ? 200 : 201);
      }
    }

    if (pathname === `${VAULT}/git/ref/heads/main` && method === "GET") return json({ object: { sha: "base-sha" } });
    if (pathname === `${VAULT}/git/refs` && method === "POST") {
      const branch = String(body?.ref ?? "").replace(/^refs\/heads\//, "");
      if (branches.has(branch)) return json({ message: "Reference already exists" }, 422);
      branches.set(branch, new Map(main));
      return json({ ref: `refs/heads/${branch}` }, 201);
    }
    if (pathname.startsWith(`${VAULT}/git/refs/heads/`)) {
      const branch = pathname.slice(`${VAULT}/git/refs/heads/`.length);
      if (method === "PATCH") {
        if (!branches.has(branch)) return json({ message: "Reference does not exist" }, 422);
        branches.set(branch, new Map(main));
        return json({ ref: `refs/heads/${branch}` });
      }
      if (method === "DELETE") {
        branches.delete(branch);
        return new Response(null, { status: 204 });
      }
    }

    if (pathname === `${VAULT}/pulls` && method === "GET") {
      const head = url.searchParams.get("head");
      const branch = head ? head.replace(/^ebyron357:/, "") : null;
      return json(
        pulls
          .filter((pull) => pull.state === "open" && (branch === null || pull.head === branch))
          .map((pull) => ({
            number: pull.number,
            html_url: pull.html_url,
            draft: pull.draft,
            state: pull.state,
            head: { ref: pull.head, repo: { full_name: "ebyron357/LifeOS-Enterprise" } },
          })),
      );
    }
    if (pathname === `${VAULT}/pulls` && method === "POST") {
      const head = String(body?.head ?? "");
      if (pulls.some((pull) => pull.state === "open" && pull.head === head)) {
        return json({ message: "Validation Failed: A pull request already exists" }, 422);
      }
      pullCounter += 1;
      const pull: FakePull = {
        number: pullCounter,
        state: "open",
        draft: body?.draft === true,
        head,
        html_url: `https://github.com/ebyron357/LifeOS-Enterprise/pull/${pullCounter}`,
      };
      pulls.push(pull);
      return json({ number: pull.number, html_url: pull.html_url, draft: pull.draft }, 201);
    }

    return json({ message: `Unexpected request ${method} ${pathname}` }, 500);
  });

  return {
    fetchMock,
    branches,
    pulls,
    calls,
    /** The one branch this fake holds whose name starts with `prefix` (fails the test if not exactly one). */
    branchWithPrefix(prefix: string) {
      const matches = [...branches.keys()].filter((name) => name.startsWith(prefix));
      if (matches.length !== 1) throw new Error(`Expected one branch with prefix ${prefix}, found ${matches.length}`);
      return matches[0];
    },
    branchNames() {
      return [...branches.keys()];
    },
    file(branch: string, filePath: string) {
      return branches.get(branch)?.get(filePath)?.content ?? null;
    },
    writes() {
      return calls.filter((call) => call.method !== "GET" && call.pathname.startsWith(VAULT));
    },
  };
}

const candidate = normalizeResource({ source: SOURCE });
const candidatePath = resourceRecordPath(candidate);
const candidatePrefix = resourceIntakeBranchPrefix(candidate.slug);

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
      openDraftPrDedupe: true,
      canonicalResourceRecord: true,
      semanticDedupe: false,
      assetFactory: false,
      automaticDisposition: false,
    });
    expect(result.capabilities.sourceProcessors.automated).toEqual(["github"]);
    const routes = result.capabilities.sourceProcessors.routes as Record<string, { processorRoute: string; automated: boolean }>;
    expect(routes.github).toEqual({ processorRoute: "GitHub evidence processor (LifeOS)", automated: true });
    for (const [sourceType, route] of Object.entries(routes)) {
      if (sourceType !== "github") expect(route.automated, sourceType).toBe(false);
    }
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
    enableWrites();
    vi.stubEnv("LIFEOS_WRITE_SECRET", "correct-secret");
    const githubFetch = vi.fn();
    vi.stubGlobal("fetch", githubFetch);

    const response = await POST(request({}, "wrong-secret"));

    expect(response.status).toBe(401);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("returns a structured 400 for a null JSON body before GitHub access", async () => {
    enableWrites();
    const githubFetch = vi.fn();
    vi.stubGlobal("fetch", githubFetch);

    const response = await POST(new Request("https://lifeos.example/api/lifeos/resource-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-secret", Origin: "https://lifeos.example" },
      body: "null",
    }));

    expect(response.status).toBe(400);
    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("creates a draft PR for a new canonical resource on a deterministic branch and never writes main directly", async () => {
    enableWrites();
    const gh = fakeGitHub();
    vi.stubGlobal("fetch", gh.fetchMock);

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      ok: true,
      duplicate: false,
      dedupe: "new-identity",
      duplicateOf: null,
      pullRequest: { number: 101, draft: true, reused: false },
      routing: { processorRoute: "GitHub evidence processor (LifeOS)", automated: true },
      boundaries: {
        architectureClassification: "PENDING",
        disposition: "PENDING",
        semanticDedupe: false,
      },
    });

    const pullCall = gh.calls.find((call) => call.method === "POST" && call.pathname === `${VAULT}/pulls`);
    const candidateBranch = gh.branchWithPrefix(candidatePrefix);
    expect(pullCall?.body).toMatchObject({ draft: true, base: "main", head: candidateBranch });
    expect(candidateBranch).toMatch(new RegExp(`^lifeos/resource-intake/${candidate.slug}--[0-9a-f]{10}$`));
    expect(gh.file("main", candidatePath)).toBeNull();
    expect(gh.file(candidateBranch, candidatePath)).toContain('processor_route: "GitHub evidence processor (LifeOS)"');
  });

  it("re-fetches GitHub evidence server-side at write time and ignores client-supplied evidence", async () => {
    enableWrites();
    const gh = fakeGitHub();
    vi.stubGlobal("fetch", gh.fetchMock);

    const response = await POST(request({
      evidence: { license: "FAKE-CLIENT-LICENSE", architectureSuggestion: "PLATFORM", stars: 999999 },
      evidence_status: "source-evidence-captured",
    }));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.evidence).toMatchObject({ status: "source-evidence-captured" });
    expect(gh.calls.some((call) => call.pathname === CANDIDATE && call.method === "GET")).toBe(true);

    const record = gh.file(gh.branchWithPrefix(candidatePrefix), candidatePath) ?? "";
    expect(record).toContain('evidence_status: "source-evidence-captured"');
    expect(record).toMatch(/evidence_inspected_at: "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"/);
    expect(record).toContain("## Source Evidence");
    expect(record).toContain("- License: MIT");
    expect(record).toContain("- Stars: 120");
    expect(record).toContain("- Latest commit: 814711f1cf5632d1a2b3c4d5e6f7a8b9c0d1e2f3 (2026-09-15T08:10:05Z)");
    expect(record).toContain("- Processor architecture suggestion: TEMPLATE");
    expect(record).not.toContain("FAKE-CLIENT-LICENSE");
    expect(record).not.toContain("999999");
    expect(record).not.toContain("PLATFORM");
    expect(record).toContain('architecture_classification: "PENDING"');
    expect(record).toContain('disposition: "PENDING"');
  });

  it("still writes the record with evidence-unavailable when the GitHub evidence fetch fails", async () => {
    enableWrites();
    const gh = fakeGitHub({
      override: (method, pathname) => (pathname === CANDIDATE
        ? json({ message: `Bad credentials for ${TOKEN}` }, 401)
        : null),
    });
    vi.stubGlobal("fetch", gh.fetchMock);

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.evidence).toMatchObject({
      status: "evidence-unavailable",
      error: "GitHub repository metadata request failed (HTTP 401).",
    });
    const record = gh.file(gh.branchWithPrefix(candidatePrefix), candidatePath) ?? "";
    expect(record).toContain('evidence_status: "evidence-unavailable"');
    expect(record).toContain("- Error: GitHub repository metadata request failed (HTTP 401).");
    expect(record).not.toContain(TOKEN);
    expect(JSON.stringify(result)).not.toContain(TOKEN);
    expect(gh.pulls).toHaveLength(1);
  });

  it("reuses the open draft PR when the same resource is submitted again before it merges", async () => {
    enableWrites();
    const gh = fakeGitHub();
    vi.stubGlobal("fetch", gh.fetchMock);

    const first = await (await POST(request())).json();
    const secondResponse = await POST(request({ source: "https://github.com/Vercel-Labs/knowledge-agent-template.git" }));
    const second = await secondResponse.json();

    expect(secondResponse.status).toBe(200);
    expect(gh.pulls).toHaveLength(1);
    expect(gh.calls.filter((call) => call.method === "POST" && call.pathname === `${VAULT}/pulls`)).toHaveLength(1);
    expect(gh.calls.filter((call) => call.method === "POST" && call.pathname === `${VAULT}/git/refs`)).toHaveLength(1);
    expect(second).toMatchObject({
      ok: true,
      duplicate: true,
      dedupe: "open-draft-pr",
      pullRequest: { number: first.pullRequest.number, url: first.pullRequest.url, reused: true },
      duplicateOf: {
        pullRequest: { number: first.pullRequest.number, url: first.pullRequest.url },
        branch: gh.branchWithPrefix(candidatePrefix),
        path: candidatePath,
      },
    });

    const record = gh.file(gh.branchWithPrefix(candidatePrefix), candidatePath) ?? "";
    expect(record).toContain("capture_count: 2");
    expect(record.match(/^## Source Evidence$/gm)).toHaveLength(1);
    expect(record).toContain("captured again through test");
    expect(gh.file("main", candidatePath)).toBeNull();
  });

  it("never force-moves an existing branch: a leftover intake branch does not block a new capture", async () => {
    enableWrites();
    const leftover = `${candidatePrefix}0123456789`;
    const gh = fakeGitHub({ branches: [leftover] });
    vi.stubGlobal("fetch", gh.fetchMock);

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.pullRequest).toMatchObject({ reused: false, draft: true });
    expect(gh.calls.some((call) => call.method === "PATCH")).toBe(false);
    const created = gh.branchNames().filter((name) => name.startsWith(candidatePrefix) && name !== leftover);
    expect(created).toHaveLength(1);
    expect(gh.file(leftover, candidatePath)).toBeNull();
    expect(gh.file(created[0], candidatePath)).toContain('source_identity: "github:vercel-labs/knowledge-agent-template"');
    expect(gh.pulls).toHaveLength(1);
  });

  it("never reuses an intake PR the owner marked ready for review; it opens a new draft instead", async () => {
    enableWrites();
    const readyBranch = `${candidatePrefix}aaaaaaaaaa`;
    const gh = fakeGitHub({
      branches: [readyBranch],
      openPulls: [{ number: 90, state: "open", draft: false, head: readyBranch, html_url: "https://github.com/ebyron357/LifeOS-Enterprise/pull/90" }],
    });
    vi.stubGlobal("fetch", gh.fetchMock);

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.pullRequest).toMatchObject({ reused: false, draft: true });
    expect(result.pullRequest.number).not.toBe(90);
    expect(gh.file(readyBranch, candidatePath)).toBeNull();
    expect(gh.calls.some((call) => call.method === "PUT" && call.body?.branch === readyBranch)).toBe(false);
  });

  it("keeps simultaneous first captures on separate branches so neither can overwrite the other", async () => {
    enableWrites();
    const gh = fakeGitHub();
    vi.stubGlobal("fetch", gh.fetchMock);

    const responses = await Promise.all([POST(request()), POST(request({ source: "https://github.com/vercel-labs/knowledge-agent-template/" }))]);

    for (const response of responses) expect(response.status).toBe(200);
    expect(gh.calls.some((call) => call.method === "PATCH")).toBe(false);
    expect(gh.calls.some((call) => call.method === "DELETE")).toBe(false);
    const branches = gh.branchNames().filter((name) => name.startsWith(candidatePrefix));
    expect(branches.length).toBeGreaterThanOrEqual(1);
    for (const branch of branches) {
      expect(gh.file(branch, candidatePath)).toContain('source_identity: "github:vercel-labs/knowledge-agent-template"');
    }
    expect(gh.file("main", candidatePath)).toBeNull();
  });

  it("returns a clean 502 without writing when reading the canonical record fails", async () => {
    enableWrites();
    const gh = fakeGitHub({
      override: (method, pathname) => (method === "GET" && pathname.startsWith(`${VAULT}/contents/`)
        ? json({ message: `upstream failure leaking ${TOKEN}` }, 500)
        : null),
    });
    vi.stubGlobal("fetch", gh.fetchMock);
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(502);
    expect(result).toMatchObject({
      ok: false,
      error: "Could not read the canonical resource state from GitHub. Nothing was written.",
      details: { upstreamStatus: 500 },
    });
    expect(JSON.stringify(result)).not.toContain(TOKEN);
    expect(JSON.stringify(logged.mock.calls)).not.toContain(TOKEN);
    expect(gh.writes()).toHaveLength(0);
    logged.mockRestore();
  });

  it("returns a clean 502 without writing when the main ref lookup fails", async () => {
    enableWrites();
    const gh = fakeGitHub({
      override: (method, pathname) => (pathname === `${VAULT}/git/ref/heads/main`
        ? json({ message: "Bad credentials" }, 401)
        : null),
    });
    vi.stubGlobal("fetch", gh.fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(request());
    const result = await response.json();

    expect(response.status).toBe(502);
    expect(result.ok).toBe(false);
    expect(result.error).not.toContain("Bad credentials");
    expect(gh.writes()).toHaveLength(0);
  });

  it("routes a YouTube capture to the existing SOP without any GitHub evidence fetch", async () => {
    enableWrites();
    const gh = fakeGitHub();
    vi.stubGlobal("fetch", gh.fetchMock);

    const response = await POST(request({ source: "https://youtu.be/abc123XYZ", title: "A video" }));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.routing).toEqual({
      processorRoute: "80 SOPs/Process YouTube Video into LifeOS Knowledge.md",
      automated: false,
      nextAction: expect.stringContaining("80 SOPs/Process YouTube Video into LifeOS Knowledge.md"),
    });
    expect(result.evidence).toEqual({ status: "capture-only", inspectedAt: null });
    expect(gh.calls.some((call) => !call.pathname.startsWith(VAULT))).toBe(false);
    const record = gh.file(gh.branchWithPrefix(resourceIntakeBranchPrefix(normalizeResource({ source: "https://youtu.be/abc123XYZ" }).slug)), result.resource.path) ?? "";
    expect(record).toContain('evidence_status: "capture-only"');
    expect(record).not.toContain("## Source Evidence");
  });

  it("contains explicit draft-PR guardrails in the route implementation", () => {
    expect(routeSource).toContain("draft: true");
    expect(routeSource).toContain("base: BASE");
    expect(routeSource).toContain("directMainWrites: false");
    expect(routeSource).not.toContain("branch: BASE");
  });
});
