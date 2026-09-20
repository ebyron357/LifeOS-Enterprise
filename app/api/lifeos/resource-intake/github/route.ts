import { NextResponse } from "next/server";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import { inspectGitHubRepository } from "@/lib/resource-intelligence/github-evidence";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!validOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin not allowed." }, { status: 403 });
  }
  if (!withinAgentRateLimit(request, 30)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  const source = new URL(request.url).searchParams.get("source")?.trim() || "";
  if (!source) {
    return NextResponse.json({ ok: false, error: "source is required." }, { status: 400 });
  }

  try {
    const evidence = await inspectGitHubRepository(source, {
      token: process.env.LIFEOS_GITHUB_TOKEN,
    });
    return NextResponse.json({
      ok: true,
      evidence,
      boundaries: {
        writes: false,
        classificationIsSuggestion: true,
        disposition: "PENDING",
        implementationDecision: false,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "GitHub evidence inspection failed.",
    }, { status: 502 });
  }
}
