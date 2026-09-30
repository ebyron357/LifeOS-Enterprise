import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResourceIntakePanel } from "@/components/os/ResourceIntakePanel";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("Resource intake panel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports a reused open draft PR, source evidence status, and processor route", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      if ((init?.method ?? "GET") === "GET") return jsonResponse({ enabled: true, configured: true, mode: "draft-pr-only" });
      return jsonResponse({
        ok: true,
        duplicate: true,
        dedupe: "open-draft-pr",
        resource: { path: "40 Resources/Resource Intelligence/Records/example.md" },
        pullRequest: { number: 101, url: "https://github.com/ebyron357/LifeOS-Enterprise/pull/101", draft: true, reused: true },
        routing: { processorRoute: "GitHub evidence processor (LifeOS)", automated: true },
        evidence: { status: "source-evidence-captured", inspectedAt: "2026-09-30T10:00:00.000Z" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ResourceIntakePanel />);
    fireEvent.change(screen.getByLabelText("Resource URL or source"), {
      target: { value: "https://github.com/vercel-labs/knowledge-agent-template" },
    });
    fireEvent.change(screen.getByLabelText("Owner write secret"), { target: { value: "owner-secret" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Stage canonical Resource PR" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Stage canonical Resource PR" }));

    expect(await screen.findByText("Open draft PR updated")).toBeInTheDocument();
    expect(screen.getByText(/instead of opening a competing PR/)).toBeInTheDocument();
    expect(screen.getByText("Source evidence: source-evidence-captured")).toBeInTheDocument();
    expect(screen.getByText("Processor route: GitHub evidence processor (LifeOS) (automated, read-only)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open draft PR #101" })).toHaveAttribute(
      "href",
      "https://github.com/ebyron357/LifeOS-Enterprise/pull/101",
    );

    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    const body = JSON.parse(String(post?.[1]?.body));
    expect(body).not.toHaveProperty("evidence");
  });
});
