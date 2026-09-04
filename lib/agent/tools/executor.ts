import { redactSecrets } from "@/lib/voice/security";
import type { AgentTurnInput, ToolResult } from "../types";

const EXTERNAL_TIMEOUT_MS = 10_000;

function withTimeout(signal?: AbortSignal): AbortController {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });
  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller;
}

function completed(invocationId: string, toolId: string, summary: string, evidence: string[]): ToolResult {
  return { invocationId, toolId, ok: true, status: "completed", summary, evidence };
}

function unavailable(invocationId: string, toolId: string, message: string): ToolResult {
  return { invocationId, toolId, ok: false, status: "unavailable", summary: message, evidence: [], error: "unconfigured" };
}

function failed(invocationId: string, toolId: string, message: string): ToolResult {
  return { invocationId, toolId, ok: false, status: "failed", summary: message, evidence: [], error: "execution_failed" };
}

export async function executeExternalApprovedTool(
  input: AgentTurnInput,
  toolId: string,
  invocationId: string,
): Promise<ToolResult> {
  if (toolId === "clickup.create_task") {
    const token = process.env.CLICKUP_API_TOKEN;
    const listId = process.env.CLICKUP_LIST_ID;
    if (!token || !listId) return unavailable(invocationId, toolId, "ClickUp execution requires CLICKUP_API_TOKEN and CLICKUP_LIST_ID.");
    const controller = withTimeout();
    try {
      const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          name: `LifeOS action: ${input.text.slice(0, 80)}`,
          description: "Created from LifeOS approved runtime action.",
          priority: 3,
        }),
      });
      const payload = await response.json().catch(() => null) as { id?: string; url?: string; err?: string } | null;
      if (!response.ok) return failed(invocationId, toolId, redactSecrets(payload?.err || "ClickUp request failed."));
      const taskId = payload?.id || "unknown";
      return completed(invocationId, toolId, `Created ClickUp task ${taskId}.`, [payload?.url || `clickup_task:${taskId}`]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ClickUp request failed.";
      return failed(invocationId, toolId, redactSecrets(message));
    }
  }

  if (toolId === "slack.send_message") {
    const token = process.env.SLACK_BOT_TOKEN;
    const channel = process.env.SLACK_DEFAULT_CHANNEL;
    if (!token || !channel) return unavailable(invocationId, toolId, "Slack execution requires SLACK_BOT_TOKEN and SLACK_DEFAULT_CHANNEL.");
    const controller = withTimeout();
    try {
      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          channel,
          text: `LifeOS approved action: ${input.text}`,
        }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; ts?: string; error?: string } | null;
      if (!response.ok || !payload?.ok) return failed(invocationId, toolId, redactSecrets(payload?.error || "Slack request failed."));
      return completed(invocationId, toolId, "Sent Slack message.", [payload.ts ? `slack_ts:${payload.ts}` : "slack_message_sent"]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Slack request failed.";
      return failed(invocationId, toolId, redactSecrets(message));
    }
  }

  if (toolId === "n8n.trigger_workflow") {
    const webhook = process.env.N8N_WEBHOOK_URL;
    if (!webhook) return unavailable(invocationId, toolId, "n8n execution requires N8N_WEBHOOK_URL.");
    const controller = withTimeout();
    try {
      const response = await fetch(webhook, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "lifeos",
          approved: true,
          at: input.nowIso,
          action: input.text,
        }),
      });
      if (!response.ok) return failed(invocationId, toolId, `n8n webhook returned ${response.status}.`);
      return completed(invocationId, toolId, "Triggered n8n workflow.", [`n8n_status:${response.status}`]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "n8n request failed.";
      return failed(invocationId, toolId, redactSecrets(message));
    }
  }

  if (toolId === "vercel.deploy_production") {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    if (!token || !projectId) return unavailable(invocationId, toolId, "Vercel execution requires VERCEL_TOKEN and VERCEL_PROJECT_ID.");
    const controller = withTimeout();
    try {
      const response = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name: process.env.VERCEL_PROJECT_NAME || "lifeos-enterprise",
          project: projectId,
          target: "production",
        }),
      });
      const payload = await response.json().catch(() => null) as { id?: string; url?: string; error?: { message?: string } } | null;
      if (!response.ok) return failed(invocationId, toolId, redactSecrets(payload?.error?.message || "Vercel deploy request failed."));
      return completed(invocationId, toolId, "Triggered Vercel production deployment.", [payload?.id ? `vercel_deployment:${payload.id}` : "vercel_deployment_triggered", payload?.url || ""]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vercel deploy request failed.";
      return failed(invocationId, toolId, redactSecrets(message));
    }
  }

  return unavailable(invocationId, toolId, "No external executor exists for this tool.");
}
