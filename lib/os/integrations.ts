import { discoverToolAvailability } from "@/lib/agent/tools/registry";
import type { GitHubHealthData } from "@/lib/github/health";
import { getHermesContract } from "./hermes";

export type IntegrationState =
  | "connected"
  | "configured"
  | "available"
  | "unavailable"
  | "degraded"
  | "error";

export type IntegrationStatus = {
  id: string;
  service: string;
  state: IntegrationState;
  lastChecked: string | null;
  reason: string;
  ownerAction: string | null;
};

export function listIntegrationStatuses(input: {
  nowIso: string;
  github: GitHubHealthData;
  env?: Record<string, string | undefined>;
}): IntegrationStatus[] {
  const env = input.env ?? process.env;
  const tools = discoverToolAvailability(env);
  const hermes = getHermesContract(env);
  const writeEnabled = env.LIFEOS_WRITE_ENABLED === "true";

  function fromTool(id: string, service: string, ownerAction: string): IntegrationStatus {
    const tool = tools[id];
    return {
      id,
      service,
      state: (tool?.availability ?? "unavailable") as IntegrationState,
      lastChecked: input.nowIso,
      reason: tool?.unavailableReason || (tool?.configured ? "Credentials present. Live connectivity is not probed as connected." : "Not configured."),
      ownerAction: tool?.configured ? (writeEnabled ? null : "Writes stay locked until LIFEOS_WRITE_ENABLED=true and the owner write secret are set.") : ownerAction,
    };
  }

  return [
    {
      id: "lifeos-vault",
      service: "LifeOS vault",
      state: "available",
      lastChecked: input.nowIso,
      reason: "Canonical Markdown vault is read on the server. This is local data, not an external login.",
      ownerAction: null,
    },
    {
      id: "github",
      service: "GitHub",
      state: input.github.connected ? "connected" : "unavailable",
      lastChecked: input.github.updatedAt || input.nowIso,
      reason: input.github.connected
        ? `Public repository health read succeeded. Open PRs: ${input.github.openPullRequests}. Last workflow: ${input.github.lastWorkflow}.`
        : "GitHub public health read failed or is unavailable.",
      ownerAction: input.github.connected ? null : "Confirm the repository is public or supply LIFEOS_GITHUB_TOKEN for private reads.",
    },
    fromTool("clickup.create_task", "ClickUp", "Add CLICKUP_API_TOKEN and CLICKUP_LIST_ID to enable approved task creation."),
    fromTool("slack.send_message", "Slack", "Add SLACK_BOT_TOKEN and SLACK_DEFAULT_CHANNEL to enable approved posting."),
    fromTool("n8n.trigger_workflow", "n8n", "Add N8N_WEBHOOK_URL to enable approved workflow triggers."),
    fromTool("vercel.deploy_production", "Vercel", "Add VERCEL_TOKEN and VERCEL_PROJECT_ID to enable approved deploys."),
    {
      id: "hermes",
      service: "Hermes",
      state: hermes.state,
      lastChecked: input.nowIso,
      reason: hermes.limitation,
      ownerAction: hermes.available ? null : "Set HERMES_ENDPOINT and HERMES_TOKEN only if a real Hermes runtime exists. Do not invent a connection.",
    },
    {
      id: "google-workspace",
      service: "Google Workspace",
      state: env.REVENUE_SHEET_ID && env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "configured" : "unavailable",
      lastChecked: input.nowIso,
      reason: env.REVENUE_SHEET_ID && env.GOOGLE_SERVICE_ACCOUNT_EMAIL
        ? "Revenue sheet credentials are present. Live sheet health is reported by Revenue Radar, not assumed connected."
        : "No authorized Google Workspace source is configured.",
      ownerAction: env.REVENUE_SHEET_ID ? null : "Connect an approved sheet only if Revenue Radar should be active.",
    },
  ];
}
