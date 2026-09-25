import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCheckpoint,
  checkpointRecordPath,
  isCheckpointRecordPath,
  parseCheckpointOverrides,
  parseCheckpointRecord,
  renderCheckpointRecord,
} from "@/lib/continuity/checkpoint";
import type { ContinuityCheckpointInput, ResumePackage } from "@/lib/continuity/model";

vi.mock("@/lib/continuity/sources", () => ({
  getContinuityResumePackage: vi.fn(async () => ({
    source: "derived",
    focus: { name: "LifeOS Enterprise", path: "10 Projects/LifeOS Enterprise.md", href: "/projects" },
    whereWasI: "Reviewing PR #71",
    whatWasIDoing: "Resource review lanes",
    desiredOutcome: "Green CI",
    happenedSince: ["PR #71 merged"],
    needsOwner: [],
    agentCanContinue: [],
    blocked: [],
    doNotRepeat: ["Do not rebuild the Command Center."],
    relevantPrompts: [],
    next: { detail: "Start checkpoint writes", ownership: "agent", href: "/" },
  }) as unknown as ResumePackage),
}));

const { GET, POST } = await import("@/app/api/lifeos/continuity/checkpoint/route");
const routeSource = readFileSync(path.join(process.cwd(), "app/api/lifeos/continuity/checkpoint/route.ts"), "utf8");

const snapshot: ContinuityCheckpointInput = {
  path: "",
  title: "",
  capturedAt: "2026-09-25T06:30:00.000Z",
  project: "LifeOS Enterprise",
  lastCompleted: "Merged PR #71",
  currentState: "Continuity writes",
  nextAction: "Add tests",
  owner: "agent",
  sourceOfTruth: "docs/CONTINUITY.md",
  blocker: "",
  doNotRepeat: ["Do not rebuild the Command Center."],
  evidence: ["source:derived"],
  sessionStatus: "OPEN",
};

describe("checkpoint rendering", () => {
  it("bounds the title the same way everywhere it is used", () => {
    const checkpoint = buildCheckpoint(snapshot, { title: "x".repeat(400) });
    expect(checkpoint.title).toHaveLength(160);
    expect(parseCheckpointRecord(checkpoint.path, renderCheckpointRecord(checkpoint))?.title).toBe(checkpoint.title);
  });


  it("round-trips values containing colons, quotes, and newlines without corrupting frontmatter", () => {
    const checkpoint = buildCheckpoint(snapshot, {
      title: 'Resume: "alpha" plan',
      nextAction: "Run tests: unit\nthen e2e",
      blocker: "needs_owner: merge",
    });
    const source = renderCheckpointRecord(checkpoint);
    const parsed = parseCheckpointRecord(checkpoint.path, source);
    expect(parsed?.title).toBe('Resume: "alpha" plan');
    expect(parsed?.nextAction).toBe("Run tests: unit then e2e");
    expect(parsed?.blocker).toBe("needs_owner: merge");
    expect(parsed?.project).toBe("LifeOS Enterprise");
    expect(parsed?.evidence).toContain("source:derived");
    expect(source.split("\n---\n")[0].split("\n").every((line) => line === "---" || /^[a-z_]+:|^ {2}- /.test(line))).toBe(true);
  });

  it("derives a canonical per-request path and titles untitled checkpoints", () => {
    const checkpoint = buildCheckpoint(snapshot, {}, "abc123");
    expect(checkpoint.path).toBe(checkpointRecordPath(snapshot.capturedAt, "LifeOS Enterprise", "abc123"));
    expect(buildCheckpoint(snapshot, {}).path).not.toBe(buildCheckpoint(snapshot, {}).path);
    expect(isCheckpointRecordPath(checkpoint.path)).toBe(true);
    expect(checkpoint.title).toBe("Resume checkpoint — LifeOS Enterprise");
    expect(isCheckpointRecordPath("Command Center/Checkpoints/../../README.md")).toBe(false);
    expect(isCheckpointRecordPath("10 Projects/x.md")).toBe(false);
  });

  it("validates override shapes", () => {
    expect(parseCheckpointOverrides(undefined)).toEqual({ ok: true, overrides: {} });
    expect(parseCheckpointOverrides([]).ok).toBe(false);
    expect(parseCheckpointOverrides({ nextAction: 5 }).ok).toBe(false);
    expect(parseCheckpointOverrides({ evidence: "one" }).ok).toBe(false);
    expect(parseCheckpointOverrides({ sessionStatus: "paused" }).ok).toBe(false);
    expect(parseCheckpointOverrides({ sessionStatus: ["open"] }).ok).toBe(false);
    const parsed = parseCheckpointOverrides({ nextAction: "  Ship\nit ", sessionStatus: "closed", evidence: ["a", ""] });
    expect(parsed).toEqual({ ok: true, overrides: { nextAction: "Ship it", sessionStatus: "CLOSED", evidence: ["a"] } });
  });
});

function request(body: unknown, secret = "test-secret") {
  return new Request("https://lifeos.example/api/lifeos/continuity/checkpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}`, Origin: "https://lifeos.example" },
    body: JSON.stringify(body),
  });
}

function enableWrites() {
  vi.stubEnv("LIFEOS_WRITE_ENABLED", "true");
  vi.stubEnv("LIFEOS_WRITE_SECRET", "test-secret");
  vi.stubEnv("LIFEOS_GITHUB_TOKEN", "server-only-token");
}

function githubMock(exists = false) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const target = String(url);
    const method = init?.method ?? "GET";
    if (target.includes("/contents/") && method === "GET") {
      return exists
        ? new Response(JSON.stringify({ sha: "x", content: Buffer.from("---\ntype: checkpoint\n---\n").toString("base64") }), { status: 200 })
        : new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
    }
    if (target.includes("/git/ref/heads/main")) return new Response(JSON.stringify({ object: { sha: "base" } }), { status: 200 });
    if (target.endsWith("/git/refs") && method === "POST") return new Response("{}", { status: 201 });
    if (target.includes("/contents/") && method === "PUT") return new Response("{}", { status: 201 });
    if (target.endsWith("/pulls") && method === "POST") {
      return new Response(JSON.stringify({ number: 72, html_url: "https://github.com/example/pull/72" }), { status: 201 });
    }
    return new Response(JSON.stringify({ message: "Unexpected" }), { status: 500 });
  });
}

describe("checkpoint write route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports draft-PR-only, create-only boundaries", async () => {
    const result = await (await GET()).json();
    expect(result).toMatchObject({ mode: "draft-pr-only", directMainWrites: false, capabilities: { overwriteExisting: false } });
  });

  it("fails closed without the write path and before GitHub access on a wrong secret", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("LIFEOS_WRITE_ENABLED", "false");
    expect((await POST(request({}))).status).toBe(503);
    enableWrites();
    expect((await POST(request({}, "wrong"))).status).toBe(401);
    expect((await POST(request({ checkpoint: "nope" }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stages a snapshot checkpoint with owner fields as a draft PR", async () => {
    enableWrites();
    const fetchMock = githubMock();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({ checkpoint: { lastCompleted: "Merged #71", sessionStatus: "CLOSED" } }));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      ok: true,
      checkpoint: { project: "LifeOS Enterprise", nextAction: "Start checkpoint writes", sessionStatus: "CLOSED" },
      pullRequest: { number: 72, draft: true },
    });
    expect(isCheckpointRecordPath(result.path)).toBe(true);

    const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
    const putBody = JSON.parse(String(put?.[1]?.body));
    expect(putBody.branch).toMatch(/^lifeos\/checkpoint-/);
    expect(putBody.sha).toBeUndefined();
    const markdown = Buffer.from(putBody.content, "base64").toString("utf8");
    expect(markdown).toContain('last_completed: "Merged #71"');
    expect(markdown).toContain("session_status: CLOSED");

    const pull = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/pulls"));
    expect(JSON.parse(String(pull?.[1]?.body))).toMatchObject({ draft: true, base: "main" });
  });

  it("gives concurrent saves distinct checkpoint paths", async () => {
    enableWrites();
    const fetchMock = githubMock();
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T06:45:00.000Z"));
    try {
      const responses = await Promise.all([POST(request({})), POST(request({}))]);
      const paths = await Promise.all(responses.map(async (response) => (await response.json()).path));
      expect(responses.map((response) => response.status)).toEqual([200, 200]);
      expect(new Set(paths).size).toBe(2);
      const puts = fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT").map(([url]) => String(url));
      expect(new Set(puts).size).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects a whitespace-only next action", async () => {
    enableWrites();
    const { getContinuityResumePackage } = await import("@/lib/continuity/sources");
    vi.mocked(getContinuityResumePackage).mockResolvedValueOnce({
      ...(await getContinuityResumePackage()),
      next: { detail: "   ", ownership: "agent", href: "/" },
    } as ResumePackage);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await POST(request({ checkpoint: { nextAction: "  \n " } }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never overwrites an existing checkpoint", async () => {
    enableWrites();
    const fetchMock = githubMock(true);
    vi.stubGlobal("fetch", fetchMock);
    expect((await POST(request({}))).status).toBe(409);
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false);
  });

  it("keeps draft-PR guardrails in the implementation", () => {
    expect(routeSource).toContain("draft: true");
    expect(routeSource).toContain("base: BASE");
    expect(routeSource).toContain("directMainWrites: false");
    expect(routeSource).not.toContain("branch: BASE");
  });
});
