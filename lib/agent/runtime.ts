import { sanitizeImportedText } from "@/lib/portfolio/sanitize";
import { executeReadTool } from "@/lib/voice/tools";
import type { VoiceCommandContext } from "@/lib/voice/commands";
import { parseVoiceCommand } from "@/lib/voice/commands";
import { createActivityEvent } from "./activity";
import {
  createAuthoritativeApproval,
  projectRevisionBinding,
  publicApprovalView,
  registerAuthoritativeApproval,
} from "./approvals";
import { canAutoExecute, decideApproval, DEFAULT_OWNER_EXECUTION_POLICY, requiresApproval } from "./policy";
import { describeScreenShare, type ScreenShareSnapshot } from "@/lib/screen/state";
import { buildTeachingPlan, describeCurrentTeachingStep, detectTeachingMode } from "./teaching";
import { getRegisteredTool, listRegisteredTools } from "./tools/registry";
import { executeExternalApprovedTool } from "./tools/executor";
import type {
  AgentState,
  AgentTurnInput,
  AgentTurnResult,
  ApprovalRequest,
  ScreenAwarenessSnapshot,
  ToolInvocation,
  ToolResult,
} from "./types";

function voiceContextFromVault(input: AgentTurnInput): VoiceCommandContext {
  return {
    projects: input.vault.projects,
    agents: input.vault.agents,
    activeProjects: input.vault.activeProjects,
    waitingOn: input.vault.waitingOn,
    reviewsDue: input.vault.reviewsDue,
  };
}

function screenSnapshotToShare(screen: ScreenAwarenessSnapshot | null): ScreenShareSnapshot {
  if (!screen) {
    return {
      state: "idle",
      sourceName: null,
      width: null,
      height: null,
      startedAt: null,
      capturedAt: null,
      analysisPaused: false,
      error: null,
    };
  }
  const state = !screen.sharing
    ? screen.permission === "denied"
      ? "denied"
      : screen.permission === "unsupported"
        ? "unsupported"
        : screen.permission === "ended"
          ? "ended"
          : "idle"
    : screen.paused
      ? "paused"
      : "sharing";
  return {
    state,
    sourceName: screen.sourceName,
    width: screen.width,
    height: screen.height,
    startedAt: screen.capturedAt,
    capturedAt: screen.capturedAt,
    analysisPaused: screen.paused,
    error: screen.permission === "denied" ? "Screen share permission was denied." : null,
  };
}

function looksLikeVisualQuestion(text: string): boolean {
  return /\b(what am i looking at|where do i click|walk me through this screen|what is wrong here|read this message|what should i do next|help me navigate|explain this error|show me what to click)\b/i.test(text);
}

function makeInvocation(toolId: string, args: Record<string, unknown>, nowIso: string): ToolInvocation {
  return { id: `inv-${toolId}-${nowIso}`, toolId, args, requestedAt: nowIso };
}

function approvalFromInvocation(
  invocation: ToolInvocation,
  summary: string,
  sessionId: string,
  projectPath: string | null,
  revisionBinding: string | null,
): ApprovalRequest {
  const authoritative = registerAuthoritativeApproval(
    createAuthoritativeApproval({
      sessionId,
      toolId: invocation.toolId,
      riskLevel: getRegisteredTool(invocation.toolId)?.riskLevel ?? "high",
      summary,
      args: invocation.args,
      createdAt: invocation.requestedAt,
      projectPath,
      pathAllowlist: projectPath ? [projectPath] : [],
      revisionBinding,
      scope: `tool:${invocation.toolId}`,
    }),
  );
  return publicApprovalView(authoritative);
}

function executeConfiguredTool(input: AgentTurnInput, invocation: ToolInvocation): ToolResult {
  const tool = getRegisteredTool(invocation.toolId);
  if (!tool) {
    return { invocationId: invocation.id, toolId: invocation.toolId, ok: false, status: "failed", summary: "Unknown tool.", evidence: [], error: "unknown_tool" };
  }
  if (!tool.configured) {
    return {
      invocationId: invocation.id,
      toolId: tool.id,
      ok: false,
      status: "unavailable",
      summary: tool.unavailableReason || `${tool.name} is not configured.`,
      evidence: [],
      error: "unconfigured",
    };
  }

  if (tool.id === "lifeos.read_projects") {
    const names = input.vault.projects.slice(0, 8).map((project) => `${project.name} (${project.status})`);
    return { invocationId: invocation.id, toolId: tool.id, ok: true, status: "completed", summary: names.join("; ") || "No projects found.", evidence: names };
  }
  if (tool.id === "github.inspect_health") {
    const summary = "GitHub health is reported by the Command Center widget from public repository reads. This tool does not invent workflow or pull-request counts.";
    return { invocationId: invocation.id, toolId: tool.id, ok: true, status: "completed", summary, evidence: [summary] };
  }
  if (tool.id === "lifeos.read_attention") {
    const blocked = input.vault.projects.filter((project) => project.status === "blocked" || project.blocker);
    const waiting = input.vault.projects.filter((project) => project.status === "waiting" || project.waitingOn);
    const summary = `${blocked.length} blocked, ${waiting.length} waiting, ${input.vault.reviewsDue} reviews due.`;
    return { invocationId: invocation.id, toolId: tool.id, ok: true, status: "completed", summary, evidence: [summary] };
  }
  if (tool.id === "lifeos.read_screen_context") {
    const description = describeScreenShare(screenSnapshotToShare(input.screen), Date.parse(input.nowIso));
    return { invocationId: invocation.id, toolId: tool.id, ok: true, status: "completed", summary: description, evidence: [description] };
  }
  if (tool.id === "lifeos.search_knowledge" || tool.id === "docs.retrieve") {
    const summary = "LifeOS durable writes still use ChangePlanPersistence → draft change plan → draft pull request. Voice and screen sessions are ephemeral.";
    return { invocationId: invocation.id, toolId: tool.id, ok: true, status: "completed", summary, evidence: [summary] };
  }
  if (tool.id === "mcp.discover") {
    const configured = listRegisteredTools().filter((item) => item.configured).map((item) => item.id);
    const unavailable = listRegisteredTools().filter((item) => !item.configured).map((item) => `${item.id}: ${item.unavailableReason}`);
    return {
      invocationId: invocation.id,
      toolId: tool.id,
      ok: true,
      status: "completed",
      summary: `Configured: ${configured.join(", ")}. Unavailable: ${unavailable.join(" | ")}`,
      evidence: [...configured, ...unavailable],
    };
  }
  if (tool.id === "lifeos.stage_project_change") {
    const project = input.vault.projects[0];
    return {
      invocationId: invocation.id,
      toolId: tool.id,
      ok: true,
      status: "completed",
      summary: "Staged a proposal-only change plan. Nothing was written to main.",
      evidence: ["write_mode=proposal-only"],
      stagedChange: {
        schema: "lifeos.change-plan.v1",
        write_mode: "proposal-only",
        project: project?.name ?? "unknown",
        path: project?.path ?? "",
      },
    };
  }
  if (tool.id === "learning.teach_step") {
    return { invocationId: invocation.id, toolId: tool.id, ok: true, status: "completed", summary: "Teaching step prepared.", evidence: ["teaching"] };
  }

  return {
    invocationId: invocation.id,
    toolId: tool.id,
    ok: false,
    status: "unavailable",
    summary: tool.unavailableReason || "This integration is not configured.",
    evidence: [],
    error: "unconfigured",
  };
}

export function processAgentTurn(input: AgentTurnInput): AgentTurnResult {
  const sanitized = sanitizeImportedText(input.text);
  const text = sanitized.text.trim();
  const activity = [
    createActivityEvent("mission-started", "Owner turn received.", { at: input.nowIso }),
  ];

  if (input.paused) {
    return {
      reply: "The agent is paused. Resume it to continue.",
      spokenReply: "The agent is paused.",
      state: "paused",
      mission: null,
      currentTask: null,
      nextStep: "Resume the agent when you want it to continue.",
      lastCompletedStep: null,
      waitingForOwner: true,
      invocations: [],
      results: [],
      approvals: input.pendingApprovals,
      activity: [...activity, createActivityEvent("agent-paused", "Turn ignored because the agent is paused.", { at: input.nowIso })],
      teaching: null,
      evidence: ["agent-paused"],
    };
  }

  if (!text) {
    return {
      reply: "I did not receive any text to work with.",
      spokenReply: "I did not catch that.",
      state: "idle",
      mission: null,
      currentTask: null,
      nextStep: null,
      lastCompletedStep: null,
      waitingForOwner: false,
      invocations: [],
      results: [],
      approvals: input.pendingApprovals,
      activity,
      teaching: null,
      evidence: [],
    };
  }

  const teachingMode = input.teachingMode ?? detectTeachingMode(text);
  const visual = looksLikeVisualQuestion(text);
  const requestedToolIds: string[] = [];

  if (visual || /\bscreen\b/i.test(text)) requestedToolIds.push("lifeos.read_screen_context");
  if (/\bproject|blocked|waiting|attention|portfolio\b/i.test(text)) requestedToolIds.push("lifeos.read_attention", "lifeos.read_projects");
  if (/\btool|mcp|integration|configured\b/i.test(text)) requestedToolIds.push("mcp.discover");
  if (/\bchange (status|priority)|stage|draft pr|update the project\b/i.test(text)) requestedToolIds.push("lifeos.stage_project_change");
  if (/\bgithub\b/i.test(text) && /\b(health|workflow|ci|pull requests?|prs?)\b/i.test(text) && !/\bmerge\b/i.test(text)) {
    requestedToolIds.push("github.inspect_health");
  }
  if (/\bmerge\b/i.test(text)) requestedToolIds.push("github.merge_pull_request");
  if (/\bslack\b/i.test(text)) requestedToolIds.push("slack.send_message");
  if (/\bdeploy\b/i.test(text)) requestedToolIds.push("vercel.deploy_production");
  if (/\bclickup\b/i.test(text)) requestedToolIds.push("clickup.create_task");
  if (teachingMode) requestedToolIds.push("learning.teach_step");
  if (!requestedToolIds.length) requestedToolIds.push("lifeos.read_attention", "docs.retrieve");

  const uniqueToolIds = [...new Set(requestedToolIds)];
  const invocations: ToolInvocation[] = [];
  const results: ToolResult[] = [];
  const approvals: ApprovalRequest[] = [...input.pendingApprovals];
  const evidence: string[] = sanitized.wasModified ? ["Untrusted input was sanitized before use."] : [];

  for (const toolId of uniqueToolIds) {
    const tool = getRegisteredTool(toolId);
    if (!tool) continue;
    const invocation = makeInvocation(toolId, { query: text }, input.nowIso);
    invocations.push(invocation);
    activity.push(createActivityEvent("tool-invoked", `Requested ${tool.name}.`, { at: input.nowIso, toolId }));

    if (!tool.configured) {
      const result = executeConfiguredTool(input, invocation);
      results.push(result);
      activity.push(createActivityEvent("tool-result", result.summary, { at: input.nowIso, toolId, evidence: result.evidence }));
      continue;
    }

    if (requiresApproval(tool, DEFAULT_OWNER_EXECUTION_POLICY) && !canAutoExecute(tool)) {
      const existing = approvals.find((item) => item.toolId === tool.id && item.decision === "pending");
      if (existing) {
        results.push({
          invocationId: invocation.id,
          toolId: tool.id,
          ok: false,
          status: "blocked-approval",
          summary: `Waiting for owner approval: ${existing.summary}`,
          evidence: [existing.id],
        });
        continue;
      }
      const boundProject = input.vault.priorities[0] ?? input.vault.projects[0] ?? null;
      const projectPath = boundProject?.path ?? null;
      const request = approvalFromInvocation(
        invocation,
        `${tool.name} requires explicit approval.`,
        input.sessionId,
        projectPath,
        boundProject
          ? projectRevisionBinding({
              path: boundProject.path,
              status: boundProject.status,
              nextAction: boundProject.nextAction,
            })
          : null,
      );
      approvals.push(request);
      results.push({
        invocationId: invocation.id,
        toolId: tool.id,
        ok: false,
        status: "blocked-approval",
        summary: request.summary,
        evidence: [request.id],
      });
      activity.push(createActivityEvent("approval-requested", request.summary, { at: input.nowIso, toolId }));
      continue;
    }

    const result = executeConfiguredTool(input, invocation);
    results.push(result);
    evidence.push(...result.evidence);
    activity.push(createActivityEvent("tool-result", result.summary, { at: input.nowIso, toolId, evidence: result.evidence }));
  }

  const voiceParsed = parseVoiceCommand(text, voiceContextFromVault(input));
  if (voiceParsed.kind === "read") {
    const voiceResult = executeReadTool(voiceParsed.tool, voiceContextFromVault(input), voiceParsed.args);
    results.push({
      invocationId: `voice-${voiceParsed.tool}`,
      toolId: `voice.${voiceParsed.tool}`,
      ok: voiceResult.ok,
      status: voiceResult.ok ? "completed" : "failed",
      summary: voiceResult.humanResult,
      evidence: [voiceResult.humanResult],
      error: voiceResult.error,
    });
    evidence.push(voiceResult.humanResult);
  }

  const teaching = teachingMode ? buildTeachingPlan(teachingMode, text, Boolean(input.screen?.sharing)) : null;
  const waitingForOwner = approvals.some((item) => item.decision === "pending") || results.some((item) => item.status === "blocked-approval");
  const completed = results.filter((item) => item.status === "completed").map((item) => item.summary);
  const blocked = results.filter((item) => item.status !== "completed").map((item) => item.summary);
  const replyParts = [
    completed.join(" "),
    blocked.length ? `Needs you: ${blocked.join(" ")}` : "",
    teaching ? describeCurrentTeachingStep(teaching) : "",
  ].filter(Boolean);
  const reply = replyParts.join(" ").trim() || "I reviewed the request against available LifeOS tools.";

  const state: AgentState = waitingForOwner ? "awaiting_approval" : "idle";
  activity.push(createActivityEvent("mission-completed", waitingForOwner ? "Turn paused for owner approval." : "Turn completed.", { at: input.nowIso }));

  return {
    reply,
    spokenReply: reply,
    state,
    mission: teaching?.goal ?? (visual ? "Help with the current screen using verified context only." : "Answer from LifeOS context."),
    currentTask: uniqueToolIds[0] ?? null,
    nextStep: waitingForOwner ? "Approve or reject the pending action." : teaching ? teaching.steps[0]?.nextHint ?? null : "Ask a follow-up or stop the session.",
    lastCompletedStep: completed[0] ?? null,
    waitingForOwner,
    invocations,
    results,
    approvals,
    activity,
    teaching,
    evidence,
  };
}

export function applyApprovalDecision(
  approvals: ApprovalRequest[],
  approvalId: string,
  decision: "approved" | "rejected",
  nowIso: string,
): ApprovalRequest[] {
  return approvals.map((item) => (item.id === approvalId ? decideApproval(item, decision, nowIso) : item));
}

export async function executeApprovedTool(input: AgentTurnInput, approval: ApprovalRequest): Promise<ToolResult> {
  const requestedPath = typeof approval.args.path === "string" ? approval.args.path : approval.projectPath;
  if (approval.pathAllowlist?.length && requestedPath && !approval.pathAllowlist.includes(requestedPath)) {
    return {
      invocationId: approval.id,
      toolId: approval.toolId,
      ok: false,
      status: "failed",
      summary: "Approved path is outside the allowlist. Nothing was executed.",
      evidence: [approval.id],
      error: "path_allowlist",
    };
  }
  if (approval.decision !== "approved") {
    return {
      invocationId: approval.id,
      toolId: approval.toolId,
      ok: false,
      status: "rejected",
      summary: "Owner rejected this action. Nothing was executed.",
      evidence: [approval.id],
    };
  }
  if (["clickup.create_task", "slack.send_message", "n8n.trigger_workflow", "vercel.deploy_production"].includes(approval.toolId)) {
    return executeExternalApprovedTool(input, approval.toolId, approval.id);
  }
  return executeConfiguredTool(input, {
    id: approval.id,
    toolId: approval.toolId,
    args: approval.args,
    requestedAt: input.nowIso,
  });
}
