/**
 * Repository content (README, issues, PR comments, workflow output) is
 * untrusted input. It is stored as evidence text only and must never be
 * interpreted as an instruction to this system or to any agent acting on
 * its behalf. This module strips/neutralizes text that looks like an
 * embedded directive before it is stored as evidence, and reports whether
 * anything was removed so callers can log it.
 */

const INSTRUCTION_PATTERNS: RegExp[] = [
  /ignore (all|any|the) (previous|prior|above) instructions?/gi,
  /disregard (all|any|the) (previous|prior|above) (instructions?|rules?)/gi,
  /you are now/gi,
  /system prompt/gi,
  /\bact as (an?|the)\b/gi,
  /\bnew instructions?:/gi,
  /\bassistant:\s*/gi,
  /\bsystem:\s*/gi,
  /grant (admin|write|deploy|billing) access/gi,
  /\brun the following command/gi,
];

const MAX_EVIDENCE_LENGTH = 500;

export type SanitizeResult = {
  text: string;
  wasModified: boolean;
  matchedPatterns: string[];
};

/**
 * Removes control characters, collapses whitespace, truncates to a bounded
 * length, and redacts any substring matching a known prompt-injection
 * shape. This is defense-in-depth, not a claim of perfect detection: the
 * real safety property is that this text is only ever displayed/stored as
 * a labeled "evidence" string and is never passed to a code path that
 * executes instructions, regardless of its content.
 */
export function sanitizeImportedText(input: string): SanitizeResult {
  const matchedPatterns: string[] = [];
  let text = String(input ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  for (const pattern of INSTRUCTION_PATTERNS) {
    if (pattern.test(text)) {
      matchedPatterns.push(pattern.source);
      text = text.replace(pattern, "[redacted: possible embedded instruction]");
    }
  }

  const wasModified = matchedPatterns.length > 0 || text.length > MAX_EVIDENCE_LENGTH;
  if (text.length > MAX_EVIDENCE_LENGTH) {
    text = `${text.slice(0, MAX_EVIDENCE_LENGTH)}…`;
  }

  return { text, wasModified, matchedPatterns };
}

export function toEvidenceString(source: string, rawText: string): string {
  const { text } = sanitizeImportedText(rawText);
  return `${source}: ${text}`;
}
