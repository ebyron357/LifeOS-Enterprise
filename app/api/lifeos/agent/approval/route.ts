import { NextResponse } from "next/server";
import { applyApprovalDecision, executeApprovedTool } from "@/lib/agent/runtime";
import { logAgentEvent } from "@/lib/agent/observability";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import type { ApprovalRequest, ScreenAwarenessSnapshot } from "@/lib/agent/types";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { authorizeVoiceRequest } from "@/lib/voice/security";

export const runtime = "nodejs";

type ApprovalBody = {
  sessionId?: string;
  approvalId?: string;
  decision?: "approved" | "rejected";
  pendingApprovals?: ApprovalRequest[];
  screen?: ScreenAwarenessSnapshot | null;
};

export async function POST(request: Request) {
  if (!validOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origin not allowed." }, { status: 403 });
  }
  if (!withinAgentRateLimit(request, 30)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  const auth = authorizeVoiceRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  let body: ApprovalBody;
  try {
    body = await request.json() as ApprovalBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.decision !== "approved" && body.decision !== "rejected") {
    return NextResponse.json({ ok: false, error: "decision must be approved or rejected." }, { status: 400 });
  }
  if (!body.approvalId) {
    return NextResponse.json({ ok: false, error: "approvalId is required." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const approvals = applyApprovalDecision(body.pendingApprovals ?? [], body.approvalId, body.decision, nowIso);
  const decided = approvals.find((item) => item.id === body.approvalId);
  if (!decided) {
    return NextResponse.json({ ok: false, error: "Unknown approval request." }, { status: 404 });
  }

  logAgentEvent({
    event: body.decision === "approved" ? "approval-accepted" : "approval-rejected",
    at: nowIso,
    sessionId: body.sessionId,
    toolId: decided.toolId,
    status: body.decision,
  });

  if (body.decision === "rejected") {
    return NextResponse.json({
      ok: true,
      approvals,
      result: {
        invocationId: decided.id,
        toolId: decided.toolId,
        ok: false,
        status: "rejected",
        summary: "Owner rejected this action. Nothing was executed.",
        evidence: [decided.id],
      },
    });
  }

  const vault = await getVaultDashboardData();
  const result = executeApprovedTool({
    sessionId: body.sessionId || "anonymous",
    channel: "text",
    text: decided.summary,
    nowIso,
    vault,
    screen: body.screen ?? null,
    pendingApprovals: approvals,
    paused: false,
    transcriptPrivacy: "ephemeral",
  }, decided);

  return NextResponse.json({ ok: true, approvals, result });
}
