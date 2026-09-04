import { NextResponse } from "next/server";
import { consumeAuthoritativeApproval, LIFEOS_REPOSITORY, publicApprovalView } from "@/lib/agent/approvals";
import { executeApprovedTool } from "@/lib/agent/runtime";
import { logAgentEvent } from "@/lib/agent/observability";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import type { ScreenAwarenessSnapshot } from "@/lib/agent/types";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { authorizeVoiceRequest } from "@/lib/voice/security";

export const runtime = "nodejs";

type ApprovalBody = {
  sessionId?: string;
  approvalId?: string;
  decision?: "approved" | "rejected";
  /** Client-supplied approvals are ignored for authorization — server store is authoritative. */
  pendingApprovals?: unknown;
  screen?: ScreenAwarenessSnapshot | null;
  projectPath?: string | null;
  repository?: string | null;
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
  if (!body.approvalId || typeof body.approvalId !== "string") {
    return NextResponse.json({ ok: false, error: "approvalId is required." }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" && body.sessionId ? body.sessionId : "";
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "sessionId is required for approval binding." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const consumed = consumeAuthoritativeApproval({
    approvalId: body.approvalId,
    decision: body.decision,
    sessionId,
    nowIso,
    projectPath: typeof body.projectPath === "string" ? body.projectPath : null,
    repository: typeof body.repository === "string" ? body.repository : LIFEOS_REPOSITORY,
  });

  if (!consumed.ok) {
    return NextResponse.json({ ok: false, error: consumed.error }, { status: consumed.status });
  }

  const decided = publicApprovalView(consumed.approval);

  logAgentEvent({
    event: body.decision === "approved" ? "approval-accepted" : "approval-rejected",
    at: nowIso,
    sessionId,
    toolId: decided.toolId,
    status: body.decision,
  });

  if (body.decision === "rejected") {
    return NextResponse.json({
      ok: true,
      approvals: [decided],
      result: {
        invocationId: decided.id,
        toolId: decided.toolId,
        ok: false,
        status: "rejected",
        summary: "Owner rejected this action. Nothing was executed.",
        evidence: [decided.id, `nonce:${consumed.approval.nonce.slice(0, 8)}`],
      },
    });
  }

  const vault = await getVaultDashboardData();
  const boundProject = decided.projectPath
    ? vault.projects.find((project) => project.path === decided.projectPath) ?? null
    : null;
  if (decided.projectPath && !boundProject) {
    return NextResponse.json({
      ok: false,
      error: "Approved project path is not present in the canonical vault.",
    }, { status: 409 });
  }

  const result = await executeApprovedTool({
    sessionId,
    channel: "text",
    text: decided.summary,
    nowIso,
    vault,
    screen: body.screen ?? null,
    pendingApprovals: [decided],
    paused: false,
    transcriptPrivacy: "ephemeral",
  }, decided);

  return NextResponse.json({
    ok: true,
    approvals: [decided],
    result,
    audit: {
      approvalId: decided.id,
      repository: consumed.approval.repository,
      projectPath: consumed.approval.projectPath,
      scope: consumed.approval.scope,
      decidedAt: decided.decidedAt,
      // nonce is truncated in evidence; full secret material is never returned
      nonceFingerprint: consumed.approval.nonce.slice(0, 8),
    },
  });
}
