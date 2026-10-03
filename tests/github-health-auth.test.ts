import { afterEach, describe, expect, it, vi } from "vitest";
import { getGitHubHealth } from "@/lib/github/health";

function stubGitHub() {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith("/pulls?state=open&per_page=100")) return Response.json([{ number: 1 }]);
    if (url.endsWith("/actions/runs?per_page=20")) return Response.json({ workflow_runs: [{ status: "completed", conclusion: "success" }] });
    return Response.json({ default_branch: "main", updated_at: "2026-10-03T00:00:00Z" });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function authorizationHeaders(fetchMock: ReturnType<typeof stubGitHub>) {
  return fetchMock.mock.calls.map((call) => (call as unknown as [string, RequestInit])[1].headers as Record<string, string>).map((headers) => headers.Authorization);
}

describe("GitHub health reads for a private repository", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the server-side token on every read when one is configured", async () => {
    vi.stubEnv("LIFEOS_GITHUB_TOKEN", "test-token");
    const fetchMock = stubGitHub();
    const health = await getGitHubHealth();
    expect(health.connected).toBe(true);
    expect(health.openPullRequests).toBe(1);
    expect(authorizationHeaders(fetchMock)).toEqual(["Bearer test-token", "Bearer test-token", "Bearer test-token"]);
  });

  it("reads without credentials when no token is configured", async () => {
    vi.stubEnv("LIFEOS_GITHUB_TOKEN", "");
    const fetchMock = stubGitHub();
    await getGitHubHealth();
    expect(authorizationHeaders(fetchMock)).toEqual([undefined, undefined, undefined]);
  });
});
