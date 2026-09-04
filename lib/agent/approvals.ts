import { createHash, randomBytes } from "node:crypto";
import type { ApprovalRequest, RiskLevel } from "./types";

export const LIFEOS_REPOSITORY = "ebyron357/LifeOS-Enterprise";
export const APPROVAL_TTL_MS = 15 * 60 * 1000;

export type AuthoritativeApproval = ApprovalRequest & {
  sessionId: string;
  expiresAt: string;
  nonce: string;
  projectPath: string | null;
  repository: string;
  pathAllowlist: string[];
  revisionBinding: string | null;
  scope: string;
  consumedAt: string | null;
};

export type ApprovalConsumeResult =
  | { ok: true; approval: AuthoritativeApproval }
  | { ok: false; error: string; status: number };

const store = new Map<string, AuthoritativeApproval>();
const consumedNonces = new Set<string>();

function shaShort(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function createAuthoritativeApproval(input: {
  sessionId: string;
  toolId: string;
  riskLevel: RiskLevel;
  summary: string;
  args: Record<string, unknown>;
  createdAt: string;
  projectPath?: string | null;
  pathAllowlist?: string[];
  revisionBinding?: string | null;
  scope?: string;
  ttlMs?: number;
}): AuthoritativeApproval {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.parse(input.createdAt) + (input.ttlMs ?? APPROVAL_TTL_MS)).toISOString();
  const id = `apr-${shaShort(`${input.sessionId}:${input.toolId}:${nonce}:${input.createdAt}`)}`;
  return {
    id,
    toolId: input.toolId,
    riskLevel: input.riskLevel,
    summary: input.summary,
    args: input.args,
    createdAt: input.createdAt,
    decision: "pending",
    decidedAt: null,
    sessionId: input.sessionId,
    expiresAt,
    nonce,
    projectPath: input.projectPath ?? null,
    repository: LIFEOS_REPOSITORY,
    pathAllowlist: input.pathAllowlist ?? (input.projectPath ? [input.projectPath] : []),
    revisionBinding: input.revisionBinding ?? null,
    scope: input.scope ?? `tool:${input.toolId}`,
    consumedAt: null,
  };
}

export function registerAuthoritativeApproval(approval: AuthoritativeApproval): AuthoritativeApproval {
  store.set(approval.id, approval);
  return approval;
}

export function getAuthoritativeApproval(id: string): AuthoritativeApproval | undefined {
  return store.get(id);
}

export function listAuthoritativeApprovals(sessionId?: string): AuthoritativeApproval[] {
  const values = [...store.values()];
  if (!sessionId) return values;
  return values.filter((item) => item.sessionId === sessionId);
}

export function publicApprovalView(approval: AuthoritativeApproval): ApprovalRequest {
  return {
    id: approval.id,
    toolId: approval.toolId,
    riskLevel: approval.riskLevel,
    summary: approval.summary,
    args: approval.args,
    createdAt: approval.createdAt,
    decision: approval.decision,
    decidedAt: approval.decidedAt,
    expiresAt: approval.expiresAt,
    nonce: approval.nonce,
    projectPath: approval.projectPath,
    repository: approval.repository,
    pathAllowlist: approval.pathAllowlist,
    revisionBinding: approval.revisionBinding,
    scope: approval.scope,
  };
}

export function consumeAuthoritativeApproval(input: {
  approvalId: string;
  decision: "approved" | "rejected";
  sessionId: string;
  nowIso: string;
  projectPath?: string | null;
  repository?: string | null;
}): ApprovalConsumeResult {
  const existing = store.get(input.approvalId);
  if (!existing) {
    return { ok: false, error: "Unknown approval request.", status: 404 };
  }
  if (existing.sessionId !== input.sessionId) {
    return { ok: false, error: "Approval session binding mismatch.", status: 403 };
  }
  if (existing.repository !== (input.repository || LIFEOS_REPOSITORY)) {
    return { ok: false, error: "Approval repository binding mismatch.", status: 403 };
  }
  if (existing.decision !== "pending" || existing.consumedAt) {
    return { ok: false, error: "Approval was already decided or replayed.", status: 409 };
  }
  if (consumedNonces.has(existing.nonce)) {
    return { ok: false, error: "Approval nonce was already consumed.", status: 409 };
  }
  if (Date.parse(input.nowIso) > Date.parse(existing.expiresAt)) {
    return { ok: false, error: "Approval has expired.", status: 410 };
  }
  if (
    existing.projectPath
    && input.projectPath
    && existing.projectPath !== input.projectPath
  ) {
    return { ok: false, error: "Approval project binding mismatch.", status: 403 };
  }
  if (
    existing.pathAllowlist.length
    && existing.projectPath
    && !existing.pathAllowlist.includes(existing.projectPath)
  ) {
    return { ok: false, error: "Approval path is outside the allowlist.", status: 403 };
  }

  const next: AuthoritativeApproval = {
    ...existing,
    decision: input.decision,
    decidedAt: input.nowIso,
    consumedAt: input.nowIso,
  };
  consumedNonces.add(existing.nonce);
  store.set(existing.id, next);
  return { ok: true, approval: next };
}

/** Test helper — clears in-memory approval state. */
export function resetAuthoritativeApprovalsForTests(): void {
  store.clear();
  consumedNonces.clear();
}
