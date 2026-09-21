import { NextResponse } from "next/server";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import { getContinuityResumePackage } from "@/lib/continuity/sources";
import { speakResumePackage } from "@/lib/continuity/derive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!validOrigin(request)) {
    return NextResponse.json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
  }
  if (!withinAgentRateLimit(request)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const resume = await getContinuityResumePackage();
  return NextResponse.json({
    ok: true,
    mode: "derived-resume-package",
    write: false,
    resume,
    spoken: speakResumePackage(resume),
    limitations: {
      slack: false,
      clickup: false,
      email: false,
      calendar: false,
      semanticMemoryIndex: false,
      durableWrite: false,
    },
  });
}
