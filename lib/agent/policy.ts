import type { ApprovalRequest, RiskLevel, ToolDefinition } from "./types";

export type OwnerExecutionPolicy = {
  autoExecuteRead: boolean;
  autoExecuteReversible: boolean;
};

export const DEFAULT_OWNER_EXECUTION_POLICY: OwnerExecutionPolicy = {
  autoExecuteRead: true,
  autoExecuteReversible: false,
};

const HIGH_RISK_IDS = new Set([
  "slack.send_message",
  "email.send",
  "vercel.deploy_production",
  "supabase.destructive_change",
  "github.merge_pull_request",
  "access.change_permissions",
  "billing.modify",
]);

export function classifyToolRisk(tool: Pick<ToolDefinition, "id" | "riskLevel">): RiskLevel {
  if (HIGH_RISK_IDS.has(tool.id)) return "high";
  return tool.riskLevel;
}

export function requiresApproval(
  tool: Pick<ToolDefinition, "id" | "riskLevel" | "requiresApproval">,
  policy: OwnerExecutionPolicy = DEFAULT_OWNER_EXECUTION_POLICY,
): boolean {
  const risk = classifyToolRisk(tool);
  if (risk === "high") return true;
  if (risk === "reversible") return tool.requiresApproval || !policy.autoExecuteReversible;
  return false;
}

export function canAutoExecute(
  tool: Pick<ToolDefinition, "id" | "riskLevel" | "requiresApproval" | "configured">,
  policy: OwnerExecutionPolicy = DEFAULT_OWNER_EXECUTION_POLICY,
): boolean {
  if (!tool.configured) return false;
  const risk = classifyToolRisk(tool);
  if (risk === "read") return policy.autoExecuteRead;
  if (risk === "reversible") return policy.autoExecuteReversible && !requiresApproval(tool, policy);
  return false;
}

export function decideApproval(request: ApprovalRequest, decision: "approved" | "rejected", nowIso: string): ApprovalRequest {
  if (request.decision !== "pending") return request;
  return { ...request, decision, decidedAt: nowIso };
}

export function isApprovedForExecution(request: ApprovalRequest | undefined): boolean {
  return request?.decision === "approved";
}
