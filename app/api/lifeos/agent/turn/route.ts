import { NextResponse } from "next/server";
import { processAgentTurn } from "@/lib/agent/runtime";
import { logAgentEvent } from "@/lib/agent/observability";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import type { AgentTurnInput, ApprovalRequest, ScreenAwarenessSnapshot, TeachingMode } from "@/lib/agent/types";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { authorizeVoiceRequest } from "@/lib/voice/security";

export const runtime = "nodejs";

type TurnBody = {
  sessionId?: string;
  text?: string;
  channel?: "text" | "voice";
  screen?: ScreenAwarenessSnapshot | null;
  paused?: boolean;
  teachingMode?: TeachingMode | null;
  pendingApprovals?: ApprovalRequest[];
  transcriptPrivacy?: "ephemeral" | "hidden";
};

export async function POST(request: Request) {
  if (!validOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin not allowed." }, { status: 403 });
  }
  if (!withinAgentRateLimit(request, 60)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  const auth = authorizeVoiceRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body: TurnBody;
  try {
    body = await request.json() as TurnBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.slice(0, 4000) : "";
  const sessionId = typeof body.sessionId === "string" && body.sessionId ? body.sessionId : "anonymous";
  const vault = await getVaultDashboardData();
  const nowIso = new Date().toISOString();
  const input: AgentTurnInput = {
    sessionId,
    channel: body.channel === "voice" ? "voice" : "text",
    text,
    nowIso,
    vault,
    screen: body.screen ?? null,
    pendingApprovals: Array.isArray(body.pendingApprovals) ? body.pendingApprovals : [],
    paused: Boolean(body.paused),
    transcriptPrivacy: body.transcriptPrivacy === "hidden" ? "hidden" : "ephemeral",
    teachingMode: body.teachingMode ?? null,
  };

  const result = await processAgentTurn(input);
  logAgentEvent({
    event: result.waitingForOwner ? "approval-requested" : "mission-completed",
    at: nowIso,
    sessionId,
    status: result.state,
  });

  return NextResponse.json({ ok: true, result });
}
