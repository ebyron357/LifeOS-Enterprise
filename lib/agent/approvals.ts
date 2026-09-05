import { createHash, randomBytes } from "node:crypto";
import {
  createMemoryApprovalStore,
  getApprovalStore,
  setApprovalStoreForTests,
} from "./approval-store";
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
    args: structuredClone(input.args),
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

export async function registerAuthoritativeApproval(approval: AuthoritativeApproval): Promise<AuthoritativeApproval | ApprovalConsumeResult> {
  const store = getApprovalStore();
  if (!store.available) {
    return { ok: false, error: store.unavailableReason || "Approval storage is unavailable.", status: 503 };
  }
  await store.set(approval);
  return approval;
}

export async function getAuthoritativeApproval(id: string): Promise<AuthoritativeApproval | undefined> {
  const store = getApprovalStore();
  if (!store.available) return undefined;
  return store.get(id);
}

export function publicApprovalView(approval: AuthoritativeApproval): ApprovalRequest {
  return {
    id: approval.id,
    toolId: approval.toolId,
    riskLevel: approval.riskLevel,
    summary: approval.summary,
    args: structuredClone(approval.args),
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

export function projectRevisionBinding(project: {
  path: string;
  status: string;
  nextAction: string;
}): string {
  return shaShort(`${project.path}|${project.status}|${project.nextAction}`);
}

export async function consumeAuthoritativeApproval(input: {
  approvalId: string;
  decision: "approved" | "rejected";
  sessionId: string;
  nowIso: string;
  projectPath?: string | null;
  repository?: string | null;
  requestedPath?: string | null;
  revisionBinding?: string | null;
}): Promise<ApprovalConsumeResult> {
  const store = getApprovalStore();
  if (!store.available) {
    return { ok: false, error: store.unavailableReason || "Approval storage is unavailable.", status: 503 };
  }
  const existing = await store.get(input.approvalId);
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
  if (Date.parse(input.nowIso) > Date.parse(existing.expiresAt)) {
    return { ok: false, error: "Approval has expired.", status: 410 };
  }
  if (existing.projectPath && existing.projectPath !== (input.projectPath || "")) {
    return { ok: false, error: "Approval project binding mismatch.", status: 403 };
  }
  const requestedPath = input.requestedPath ?? input.projectPath ?? existing.projectPath;
  if (existing.pathAllowlist.length && requestedPath && !existing.pathAllowlist.includes(requestedPath)) {
    return { ok: false, error: "Approval path is outside the allowlist.", status: 403 };
  }
  if (existing.revisionBinding) {
    if (!input.revisionBinding || input.revisionBinding !== existing.revisionBinding) {
      return { ok: false, error: "Approval revision binding mismatch.", status: 409 };
    }
  }

  const ttlSeconds = Math.max(3600, Math.ceil((Date.parse(existing.expiresAt) - Date.parse(input.nowIso)) / 1000) + 86400);
  const claimed = await store.addNonce(existing.nonce, ttlSeconds);
  if (!claimed) {
    return { ok: false, error: "Approval nonce was already consumed.", status: 409 };
  }

  const next: AuthoritativeApproval = {
    ...existing,
    args: structuredClone(existing.args),
    decision: input.decision,
    decidedAt: input.nowIso,
    consumedAt: input.nowIso,
  };
  await store.set(next);
  return { ok: true, approval: next };
}

export function resetAuthoritativeApprovalsForTests(): void {
  setApprovalStoreForTests(createMemoryApprovalStore());
}

export function isAuthoritativeApproval(value: AuthoritativeApproval | ApprovalConsumeResult): value is AuthoritativeApproval {
  return !("ok" in value);
}
