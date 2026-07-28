import type { VoiceToolDefinition, VoiceToolResult } from "./types";
import {
  buildReadToolSpeech,
  navigationForTool,
  type VoiceCommandContext,
} from "./commands";

export const VOICE_TOOLS: VoiceToolDefinition[] = [
  { name: "read_morning_brief", description: "Speak the morning brief from live vault counts.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "what_needs_attention", description: "Summarize attention items from live projects.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "list_blocked_projects", description: "List blocked projects from vault data.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "list_waiting_projects", description: "List waiting projects from vault data.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "list_overdue_projects", description: "List projects with review dates due.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "list_active_agents", description: "List active agents.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "show_command_map", description: "Switch operations surface to command map.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "show_command_board", description: "Switch operations surface to command board.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "what_changed_recently", description: "Explain verified recent-change limits.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "open_project", description: "Open a project note route.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "explain_project", description: "Explain a project from vault fields.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "explain_last_simply", description: "Explain more simply.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "read_next_action", description: "Read the current next action.", classification: "read", requiresAuth: false, requiresConfirmation: false, requiresAudit: false },
  { name: "stage_project_status", description: "Stage a project status change for approval.", classification: "write", requiresAuth: true, requiresConfirmation: true, requiresAudit: true },
  { name: "stage_project_priority", description: "Stage a project priority change for approval.", classification: "write", requiresAuth: true, requiresConfirmation: true, requiresAudit: true },
  { name: "prepare_approval_package", description: "Describe how to generate an approval package.", classification: "write", requiresAuth: true, requiresConfirmation: true, requiresAudit: true },
];

const toolByName = Object.fromEntries(VOICE_TOOLS.map((tool) => [tool.name, tool]));

export function getVoiceTool(name: string) {
  return toolByName[name];
}

const ALLOWED_STATUSES = new Set(["active", "waiting", "blocked", "complete"]);
const ALLOWED_PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);

export function validateToolInput(toolName: string, args: Record<string, unknown>): string | null {
  const tool = getVoiceTool(toolName);
  if (!tool) return `Unknown tool: ${toolName}`;
  if (toolName === "open_project" || toolName === "explain_project") {
    if (!args.project || typeof args.project !== "string") return "project is required.";
  }
  if (toolName === "stage_project_status") {
    if (typeof args.project !== "string" || typeof args.path !== "string") return "project and path are required.";
    if (typeof args.status !== "string" || !ALLOWED_STATUSES.has(args.status)) return "status must be active|waiting|blocked|complete.";
  }
  if (toolName === "stage_project_priority") {
    if (typeof args.project !== "string" || typeof args.path !== "string") return "project and path are required.";
    if (typeof args.priority !== "string" || !ALLOWED_PRIORITIES.has(args.priority)) return "priority must be P0–P3.";
  }
  return null;
}

export function executeReadTool(
  toolName: string,
  context: VoiceCommandContext,
  args: Record<string, unknown> = {},
): VoiceToolResult {
  const tool = getVoiceTool(toolName);
  if (!tool || tool.classification !== "read") {
    return { ok: false, toolName, humanResult: "Tool is not a registered read tool.", spokenResult: "That read tool is not available.", error: "invalid_tool" };
  }
  const invalid = validateToolInput(toolName, args);
  if (invalid) {
    return { ok: false, toolName, humanResult: invalid, spokenResult: invalid, error: "invalid_input" };
  }
  const spoken = buildReadToolSpeech(toolName, context, args);
  return {
    ok: true,
    toolName,
    humanResult: spoken,
    spokenResult: spoken,
    navigation: navigationForTool(toolName, args),
  };
}

export function buildWriteStagingResult(toolName: string, args: Record<string, unknown>): VoiceToolResult {
  const tool = getVoiceTool(toolName);
  if (!tool || tool.classification !== "write") {
    return { ok: false, toolName, humanResult: "Write tool is not registered.", spokenResult: "That write action is not available.", error: "invalid_tool" };
  }
  const invalid = validateToolInput(toolName, args);
  if (invalid) {
    return { ok: false, toolName, humanResult: invalid, spokenResult: invalid, error: "invalid_input" };
  }

  if (toolName === "prepare_approval_package") {
    const spoken = "Approval package preparation stays on the command board. Generate the package there, then create a draft pull request through authenticated persistence. Main remains unchanged.";
    return { ok: true, toolName, humanResult: spoken, spokenResult: spoken };
  }

  const project = String(args.project);
  const field = toolName === "stage_project_status" ? "status" : "priority";
  const to = String(toolName === "stage_project_status" ? args.status : args.priority);
  const from = String(args.from || "unknown");
  const spoken = `Staged only: ${project} ${field} ${from} to ${to}. Canonical vault files remain unchanged until an authenticated draft pull request is approved.`;
  return {
    ok: true,
    toolName,
    humanResult: spoken,
    spokenResult: spoken,
    stagedChange: {
      schema: "lifeos.change-plan.v1",
      write_mode: "proposal-only",
      source: "LifeOS Voice V1",
      changes: [{
        project,
        path: args.path,
        fields: [{ field, from, to }],
      }],
    },
  };
}
