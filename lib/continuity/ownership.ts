import type { ResumeAuthority, ResumeOwnership } from "./model";

const OWNER_ONLY = /\b(credential|mfa|2fa|secret|password|api key|payment|invoice|spend|purchase|legal|license buy|merge to main|merge pull|deploy production|delete production|irreversible|sign|approve spend|owner only|call the|phone|meeting with)\b/i;
const AGENT_DOABLE = /\b(inspect|analyze|research|document|draft pr|draft pull|write tests|typecheck|lint|extract|summarize|review evidence|read-only|propose|classify suggestion|test|audit code|compare|reconcile evidence)\b/i;
const REVIEW_REQUIRED = /\b(disposition|classify|send email|slack|schedule|preview deploy|open draft|commit)\b/i;
const FORBIDDEN = /\b(delete vault|wipe|force push|disable auth|expose secret)\b/i;

export type OwnershipDecision = {
  ownership: ResumeOwnership;
  authority: ResumeAuthority;
  reason: string;
};

export function classifyContinuityAction(text: string, extras: string[] = []): OwnershipDecision {
  const haystack = [text, ...extras].filter(Boolean).join(" ");
  if (!haystack.trim()) {
    return {
      ownership: "agent",
      authority: "always-allowed",
      reason: "No next action is recorded. An agent can inspect current evidence and propose one.",
    };
  }

  if (FORBIDDEN.test(haystack)) {
    return { ownership: "owner", authority: "forbidden", reason: "This action is forbidden without explicit owner constitutional authority." };
  }
  if (OWNER_ONLY.test(haystack)) {
    return { ownership: "owner", authority: "owner-only", reason: "This requires owner judgment, credentials, money, legal authority, or an irreversible production action." };
  }
  if (REVIEW_REQUIRED.test(haystack)) {
    return { ownership: "shared", authority: "review-required", reason: "An agent can prepare this, but a review gate is required before it becomes canonical." };
  }
  if (AGENT_DOABLE.test(haystack)) {
    return { ownership: "agent", authority: "always-allowed", reason: "This is reversible inspection, analysis, testing, or draft work an agent can continue." };
  }

  return {
    ownership: "shared",
    authority: "review-required",
    reason: "Ownership is not explicit. Treat as agent-preparable and owner-gated until evidence says otherwise.",
  };
}

export function shouldInterruptOwner(decision: OwnershipDecision): boolean {
  return decision.authority === "owner-only" || decision.authority === "forbidden";
}
