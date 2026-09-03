import type { ToolDefinition } from "../types";

function unavailable(reason: string): Pick<ToolDefinition, "configured" | "unavailableReason"> {
  return { configured: false, unavailableReason: reason };
}

function available(): Pick<ToolDefinition, "configured"> {
  return { configured: true };
}

export type EnvMap = Record<string, string | undefined>;

export function discoverToolAvailability(env: EnvMap = process.env): Record<string, Pick<ToolDefinition, "configured" | "unavailableReason">> {
  return {
    "lifeos.read_projects": available(),
    "lifeos.read_attention": available(),
    "lifeos.search_knowledge": available(),
    "lifeos.read_screen_context": available(),
    "lifeos.stage_project_change": available(),
    "github.inspect_health": available(),
    "github.merge_pull_request": unavailable("Merge is a high-risk action and is not enabled in this runtime."),
    "clickup.create_task": env.CLICKUP_API_TOKEN
      && env.CLICKUP_LIST_ID
      ? available()
      : unavailable("ClickUp is not configured. CLICKUP_API_TOKEN or CLICKUP_LIST_ID is missing."),
    "slack.send_message": env.SLACK_BOT_TOKEN
      && env.SLACK_DEFAULT_CHANNEL
      ? available()
      : unavailable("Slack is not configured. SLACK_BOT_TOKEN or SLACK_DEFAULT_CHANNEL is missing."),
    "vercel.deploy_production": env.VERCEL_TOKEN && env.VERCEL_PROJECT_ID
      ? available()
      : unavailable("Vercel deploy is not configured. VERCEL_TOKEN or VERCEL_PROJECT_ID is missing."),
    "supabase.destructive_change": unavailable("Supabase destructive changes are not enabled."),
    "n8n.trigger_workflow": env.N8N_WEBHOOK_URL
      ? available()
      : unavailable("n8n is not configured. No N8N_WEBHOOK_URL is present."),
    "calendar.read_availability": unavailable("No authorized calendar integration exists in this workspace."),
    "email.send": unavailable("Email send is not configured and is a high-risk action."),
    "docs.retrieve": available(),
    "learning.teach_step": available(),
    "mcp.discover": available(),
  };
}

const BASE_TOOLS: Array<Omit<ToolDefinition, "configured" | "unavailableReason">> = [
  { id: "lifeos.read_projects", name: "Read LifeOS projects", description: "Read current project status, blockers, and next actions from the vault.", category: "lifeos-read", riskLevel: "read", requiresApproval: false, capabilities: ["list-projects", "read-status"] },
  { id: "lifeos.read_attention", name: "Read attention items", description: "Summarize blocked, waiting, and review-due work.", category: "lifeos-read", riskLevel: "read", requiresApproval: false, capabilities: ["attention"] },
  { id: "lifeos.search_knowledge", name: "Search LifeOS knowledge", description: "Retrieve LifeOS documentation and operating guidance.", category: "knowledge", riskLevel: "read", requiresApproval: false, capabilities: ["docs", "knowledge"] },
  { id: "lifeos.read_screen_context", name: "Read shared screen context", description: "Describe verified screen-share metadata without inventing pixels.", category: "browser-screen", riskLevel: "read", requiresApproval: false, capabilities: ["screen-metadata"] },
  { id: "lifeos.stage_project_change", name: "Stage project change", description: "Prepare a draft-PR change plan for status, priority, or next action.", category: "lifeos-write-proposal", riskLevel: "reversible", requiresApproval: true, capabilities: ["stage-change-plan"] },
  { id: "github.inspect_health", name: "Inspect GitHub health", description: "Read public repository health already shown in LifeOS.", category: "github", riskLevel: "read", requiresApproval: false, capabilities: ["read-github"] },
  { id: "github.merge_pull_request", name: "Merge pull request", description: "Merge a GitHub pull request.", category: "github", riskLevel: "high", requiresApproval: true, capabilities: ["merge"] },
  { id: "clickup.create_task", name: "Create ClickUp task", description: "Create a non-destructive ClickUp task when configured.", category: "clickup", riskLevel: "reversible", requiresApproval: true, capabilities: ["create-task"] },
  { id: "slack.send_message", name: "Send Slack message", description: "Send an external Slack message.", category: "slack", riskLevel: "high", requiresApproval: true, capabilities: ["external-communication"] },
  { id: "vercel.deploy_production", name: "Deploy production", description: "Trigger a production deployment.", category: "vercel", riskLevel: "high", requiresApproval: true, capabilities: ["deploy"] },
  { id: "supabase.destructive_change", name: "Destructive database change", description: "Apply a destructive Supabase change.", category: "supabase", riskLevel: "high", requiresApproval: true, capabilities: ["schema-destroy"] },
  { id: "n8n.trigger_workflow", name: "Trigger n8n workflow", description: "Trigger an approved n8n webhook when configured.", category: "n8n", riskLevel: "reversible", requiresApproval: true, capabilities: ["automation"] },
  { id: "calendar.read_availability", name: "Read calendar availability", description: "Read authorized calendar availability.", category: "calendar", riskLevel: "read", requiresApproval: false, capabilities: ["availability"] },
  { id: "email.send", name: "Send email", description: "Send external email.", category: "email", riskLevel: "high", requiresApproval: true, capabilities: ["external-communication"] },
  { id: "docs.retrieve", name: "Retrieve documentation", description: "Retrieve LifeOS operator documentation excerpts.", category: "documentation", riskLevel: "read", requiresApproval: false, capabilities: ["docs"] },
  { id: "learning.teach_step", name: "Teaching step", description: "Produce the next teaching step for the current goal.", category: "learning", riskLevel: "read", requiresApproval: false, capabilities: ["teach"] },
  { id: "mcp.discover", name: "Discover MCP adapters", description: "Report which MCP/tool adapters are configured.", category: "mcp-adapter", riskLevel: "read", requiresApproval: false, capabilities: ["discover"] },
];

export function listRegisteredTools(env: EnvMap = process.env): ToolDefinition[] {
  const availability = discoverToolAvailability(env);
  return BASE_TOOLS.map((tool) => {
    const status = availability[tool.id] ?? unavailable("Unknown tool availability.");
    return { ...tool, ...status };
  });
}

export function getRegisteredTool(id: string, env: EnvMap = process.env): ToolDefinition | undefined {
  return listRegisteredTools(env).find((tool) => tool.id === id);
}
