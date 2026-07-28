import { NextResponse } from "next/server";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { authorizeVoiceRequest, rateLimit, redactSecrets } from "@/lib/voice/security";
import {
  buildWriteStagingResult,
  executeReadTool,
  getVoiceTool,
  validateToolInput,
} from "@/lib/voice/tools";

export const runtime = "nodejs";

type ToolBody = {
  toolName?: string;
  args?: Record<string, unknown>;
  requestId?: string;
  confirmed?: boolean;
};

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`voice-tool:${ip}`, 60)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  let body: ToolBody;
  try {
    body = await request.json() as ToolBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const toolName = body.toolName?.trim();
  if (!toolName) return NextResponse.json({ ok: false, error: "toolName is required." }, { status: 400 });
  const tool = getVoiceTool(toolName);
  if (!tool) return NextResponse.json({ ok: false, error: "Unknown tool." }, { status: 400 });

  const args = body.args && typeof body.args === "object" ? body.args : {};
  const invalid = validateToolInput(toolName, args);
  if (invalid) return NextResponse.json({ ok: false, error: invalid }, { status: 400 });

  const auth = authorizeVoiceRequest(request, { requireWriteSecret: tool.classification === "write" });
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  if (tool.classification === "write" && tool.requiresConfirmation && !body.confirmed) {
    return NextResponse.json({
      ok: false,
      needsConfirmation: true,
      error: "Explicit confirmation is required before staging a write action.",
      summary: `${toolName} requires confirmation.`,
    }, { status: 409 });
  }

  try {
    const data = await getVaultDashboardData();
    const context = {
      projects: data.projects,
      agents: data.agents,
      activeProjects: data.activeProjects,
      waitingOn: data.waitingOn,
      reviewsDue: data.reviewsDue,
    };

    if (tool.classification === "read") {
      const result = executeReadTool(toolName, context, args);
      return NextResponse.json({
        ok: result.ok,
        result,
        requestId: body.requestId || null,
        subject: auth.subject,
      });
    }

    const result = buildWriteStagingResult(toolName, args);
    // Never claim canonical completion. Staging only.
    return NextResponse.json({
      ok: result.ok,
      result,
      requestId: body.requestId || null,
      subject: auth.subject,
      persistence: "browser-staging-proposal-only",
      audit: tool.requiresAudit
        ? {
            outcome: "staged_proposal",
            toolName,
            subjectHash: auth.subject,
            at: new Date().toISOString(),
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed.";
    return NextResponse.json({ ok: false, error: redactSecrets(message) }, { status: 500 });
  }
}
