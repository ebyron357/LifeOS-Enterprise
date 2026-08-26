export type McpAdapterStatus = {
  id: string;
  name: string;
  configured: boolean;
  reason: string;
};

/**
 * Capability discovery only. This does not invent live MCP sessions.
 * Each adapter stays unavailable until its env placeholder is actually set.
 */
export type EnvMap = Record<string, string | undefined>;

export function discoverMcpAdapters(env: EnvMap = process.env): McpAdapterStatus[] {
  return [
    { id: "github", name: "GitHub", configured: Boolean(env.LIFEOS_GITHUB_TOKEN || env.GITHUB_TOKEN), reason: env.LIFEOS_GITHUB_TOKEN || env.GITHUB_TOKEN ? "Token present for existing LifeOS GitHub reads/writes." : "No GitHub token configured for privileged adapter use." },
    { id: "vercel", name: "Vercel", configured: Boolean(env.VERCEL_TOKEN), reason: env.VERCEL_TOKEN ? "Token present; production deploys still require approval." : "No VERCEL_TOKEN configured." },
    { id: "slack", name: "Slack", configured: Boolean(env.SLACK_BOT_TOKEN), reason: env.SLACK_BOT_TOKEN ? "Token present; sending messages is high-risk and requires approval." : "No SLACK_BOT_TOKEN configured." },
    { id: "clickup", name: "ClickUp", configured: Boolean(env.CLICKUP_API_TOKEN), reason: env.CLICKUP_API_TOKEN ? "Token present; task creation remains approval-gated." : "No CLICKUP_API_TOKEN configured." },
    { id: "n8n", name: "n8n", configured: Boolean(env.N8N_WEBHOOK_URL), reason: env.N8N_WEBHOOK_URL ? "Webhook present; triggers remain approval-gated." : "No N8N_WEBHOOK_URL configured." },
    { id: "supabase", name: "Supabase", configured: Boolean(env.SUPABASE_SERVICE_ROLE_KEY), reason: env.SUPABASE_SERVICE_ROLE_KEY ? "Service role present; destructive changes remain blocked." : "No SUPABASE_SERVICE_ROLE_KEY configured." },
    { id: "browser", name: "Browser / screen context", configured: true, reason: "Owner-controlled getDisplayMedia is available in supporting browsers." },
  ];
}

export function validateMcpAdapterConfig(id: string, env: EnvMap = process.env): McpAdapterStatus {
  const found = discoverMcpAdapters(env).find((adapter) => adapter.id === id);
  return found ?? { id, name: id, configured: false, reason: "Unknown adapter." };
}
