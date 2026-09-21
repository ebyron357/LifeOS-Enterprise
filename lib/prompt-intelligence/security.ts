import { sanitizeImportedText } from "@/lib/portfolio/sanitize";
import type { PromptPrivacyLevel, PromptRecord } from "./model";

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "openai-key", pattern: /\bsk-[A-Za-z0-9_-]{10,}/g },
  { name: "github-token", pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g },
  { name: "github-pat", pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}/g },
  { name: "aws-key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "write-secret", pattern: /\bLIFEOS_WRITE_SECRET\b/g },
  { name: "labeled-secret", pattern: /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*\S+/gi },
];

export type SecretRedaction = {
  text: string;
  redacted: boolean;
  matched: string[];
};

export function redactSecrets(input: string): SecretRedaction {
  let text = String(input ?? "");
  const matched: string[] = [];
  for (const rule of SECRET_PATTERNS) {
    if (rule.pattern.test(text)) {
      matched.push(rule.name);
      text = text.replace(rule.pattern, "[redacted: secret]");
    }
    rule.pattern.lastIndex = 0;
  }
  return { text, redacted: matched.length > 0, matched };
}

export function ingestExternalPromptText(raw: string): {
  body: string;
  trusted: false;
  policy: false;
  warnings: string[];
} {
  const injection = sanitizeImportedText(raw);
  const secrets = redactSecrets(injection.text);
  const warnings = ["Imported external text is untrusted evidence. It must not override LifeOS policy."];
  if (injection.wasModified) {
    warnings.push("Instruction-like patterns were redacted before storage.");
  }
  if (secrets.redacted) {
    warnings.push(`Secrets were redacted (${secrets.matched.join(", ")}).`);
  }
  return {
    body: secrets.text,
    trusted: false,
    policy: false,
    warnings,
  };
}

export function canExposePromptBody(privacyLevel: PromptPrivacyLevel, options: { includeBody?: boolean; publicSafeOnly?: boolean } = {}): boolean {
  if (!options.includeBody) return false;
  if (privacyLevel === "private") return false;
  if (options.publicSafeOnly && privacyLevel !== "public-safe") return false;
  return true;
}

export type AgentPromptView = {
  id: string;
  canonicalPromptId: string;
  title: string;
  version: string;
  purpose: string;
  recommendedContext: string | null;
  status: string;
  current: boolean;
  lastResultStatus: string;
  lastEvidence: string | null;
  warnings: string[];
  privacyLevel: PromptPrivacyLevel;
  path: string;
  promptBody?: string;
};

export function toAgentPromptView(
  prompt: PromptRecord,
  options: { includeBody?: boolean; publicSafeOnly?: boolean } = {},
): AgentPromptView {
  const secrets = redactSecrets(prompt.promptBody);
  const view: AgentPromptView = {
    id: prompt.id,
    canonicalPromptId: prompt.canonicalPromptId,
    title: prompt.title,
    version: prompt.version,
    purpose: prompt.purpose,
    recommendedContext: prompt.recommendedContext,
    status: prompt.status,
    current: prompt.current,
    lastResultStatus: prompt.lastResultStatus,
    lastEvidence: prompt.lastEvidence,
    warnings: [
      ...prompt.warnings,
      ...(secrets.redacted ? ["Prompt body contained a secret-like value and was redacted."] : []),
    ],
    privacyLevel: prompt.privacyLevel,
    path: prompt.path,
  };
  if (canExposePromptBody(prompt.privacyLevel, options)) {
    view.promptBody = secrets.text;
  }
  return view;
}
