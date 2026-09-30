/**
 * Source Evidence section for canonical Resource Intelligence records.
 *
 * Source evidence is provenance, not a decision: it records what a read-only processor observed
 * at capture time. Architecture classification and disposition stay owner-reviewed.
 */

export type ResourceEvidenceStatus = "source-evidence-captured" | "capture-only" | "evidence-unavailable";

export const RESOURCE_EVIDENCE_STATUSES: ResourceEvidenceStatus[] = [
  "source-evidence-captured",
  "capture-only",
  "evidence-unavailable",
];

export type ResourceGitHubEvidenceSnapshot = {
  repository: string;
  defaultBranch: string;
  latestCommitSha: string | null;
  latestCommitAt: string | null;
  /** SPDX identifier when the repository reports one; null when no license was detected. */
  license: string | null;
  stars: number | null;
  forks: number | null;
  archived: boolean;
  pushedAt: string | null;
  architectureSuggestion: "TEMPLATE" | null;
};

export type ResourceSourceEvidence =
  | {
      status: "source-evidence-captured";
      inspectedAt: string;
      processor: "github";
      github: ResourceGitHubEvidenceSnapshot;
    }
  | {
      status: "evidence-unavailable";
      inspectedAt: string;
      processor: "github";
      /** Safe summary only: never an upstream message, URL with credentials, or token. */
      error: string;
    };

export const SOURCE_EVIDENCE_HEADING = "## Source Evidence";

const PROCESSOR_LABEL = "GitHub evidence processor (LifeOS), read-only";

const SOURCE_EVIDENCE_NOTICE =
  "> Source evidence, not a disposition. Recorded by a read-only processor when this resource was captured. "
  + "Architecture classification and disposition remain owner-reviewed in Evaluation.";

/** Capture-time wording of the Evaluation `- Evidence:` line, keyed by evidence status. */
export const EVALUATION_EVIDENCE_LINES: Record<ResourceEvidenceStatus, string> = {
  "capture-only": "capture only; source inspection has not yet been performed.",
  "source-evidence-captured":
    "source evidence captured at intake; see Source Evidence below. Evidence is not a disposition.",
  "evidence-unavailable":
    "capture only; GitHub evidence inspection failed at intake (see Source Evidence). Capture again to retry.",
};

const GENERATED_EVALUATION_EVIDENCE = new Set(Object.values(EVALUATION_EVIDENCE_LINES));

export function isGeneratedEvaluationEvidence(value: string | null): boolean {
  return value === null || GENERATED_EVALUATION_EVIDENCE.has(value.trim());
}

function singleLine(value: string | null | undefined, max = 200): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function valueOr(value: string | null | undefined, fallback: string): string {
  const cleaned = singleLine(value);
  return cleaned || fallback;
}

export function renderSourceEvidenceSection(evidence: ResourceSourceEvidence): string {
  const lines = [
    SOURCE_EVIDENCE_HEADING,
    "",
    SOURCE_EVIDENCE_NOTICE,
    "",
    `- Evidence status: ${evidence.status}`,
    `- Inspected at: ${singleLine(evidence.inspectedAt)}`,
    `- Processor: ${PROCESSOR_LABEL}`,
  ];

  if (evidence.status === "source-evidence-captured") {
    const github = evidence.github;
    const commitDate = singleLine(github.latestCommitAt);
    lines.push(
      `- Repository: ${valueOr(github.repository, "unknown")}`,
      `- Default branch: ${valueOr(github.defaultBranch, "unknown")}`,
      `- Latest commit: ${valueOr(github.latestCommitSha, "unavailable")}${commitDate ? ` (${commitDate})` : ""}`,
      `- License: ${valueOr(github.license, "none detected")}`,
      `- Stars: ${github.stars ?? "unavailable"}`,
      `- Forks: ${github.forks ?? "unavailable"}`,
      `- Archived: ${github.archived ? "yes" : "no"}`,
      `- Last push: ${valueOr(github.pushedAt, "unavailable")}`,
      `- Processor architecture suggestion: ${
        github.architectureSuggestion
          ? `${github.architectureSuggestion} (README explicitly describes a template or starter with clone, fork, or customization guidance; suggestion only)`
          : "none (README evidence does not support a suggestion)"
      }`,
      "- Processor disposition suggestion: PENDING (the processor never chooses a disposition)",
    );
  } else {
    lines.push(
      `- Error: ${valueOr(evidence.error, "GitHub evidence inspection failed.")}`,
      "- Result: the record was written without source evidence. Capture again to retry inspection.",
    );
  }

  return `${lines.join("\n")}\n`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function headingIndex(markdown: string, heading: string): number {
  const match = new RegExp(`^${escapeRegExp(heading)}[ \\t]*$`, "m").exec(markdown);
  return match ? match.index : -1;
}

/** Bounds of a `## ` section: from its heading up to (not including) the next `## ` heading. */
export function sectionBounds(markdown: string, heading: string): { start: number; end: number } | null {
  const start = headingIndex(markdown, heading);
  if (start === -1) return null;
  const next = markdown.indexOf("\n## ", start + heading.length);
  return { start, end: next === -1 ? markdown.length : next + 1 };
}

/**
 * Replaces the Source Evidence section, or inserts it after Evaluation and before Capture History.
 * Never produces a second Source Evidence section.
 */
export function upsertSourceEvidenceSection(markdown: string, section: string): string {
  const block = `${section.replace(/\s*$/, "")}\n\n`;
  const existing = sectionBounds(markdown, SOURCE_EVIDENCE_HEADING);
  if (existing) {
    const tail = markdown.slice(existing.end);
    return markdown.slice(0, existing.start) + (tail ? block : block.replace(/\n$/, "")) + tail;
  }

  const history = sectionBounds(markdown, "## Capture History");
  if (history) return markdown.slice(0, history.start) + block + markdown.slice(history.start);

  const evaluation = sectionBounds(markdown, "## Evaluation");
  if (evaluation) {
    const tail = markdown.slice(evaluation.end);
    const head = markdown.slice(0, evaluation.end).replace(/\s*$/, "\n\n");
    return head + (tail ? block : block.replace(/\n$/, "")) + tail;
  }

  return `${markdown.replace(/\s*$/, "")}\n\n${block.replace(/\n$/, "")}`;
}

/**
 * Records a failed refresh inside an existing Source Evidence section without discarding the
 * evidence captured by an earlier successful inspection.
 */
export function noteEvidenceRefreshFailure(
  markdown: string,
  evidence: Extract<ResourceSourceEvidence, { status: "evidence-unavailable" }>,
  previousInspectedAt: string | null,
): string {
  const bounds = sectionBounds(markdown, SOURCE_EVIDENCE_HEADING);
  if (!bounds) return markdown;
  const line = `- Latest refresh attempt: ${singleLine(evidence.inspectedAt)} failed: ${valueOr(evidence.error, "GitHub evidence inspection failed.")} `
    + `The evidence above is from the inspection at ${valueOr(previousInspectedAt, "an earlier capture")}.`;
  const body = markdown
    .slice(bounds.start, bounds.end)
    .replace(/^- Latest refresh attempt:.*(?:\n|$)/m, "")
    .replace(/\s*$/, "");
  return upsertSourceEvidenceSection(markdown, `${body}\n${line}\n`);
}

/**
 * Converts any evidence failure into a fixed, safe summary. Upstream messages are never echoed, so
 * tokens, credentials, or proxy details cannot leak into a canonical record.
 */
export function safeEvidenceError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : "";
  if (name === "TimeoutError" || name === "AbortError") return "GitHub evidence request timed out.";
  if (/requires a GitHub repository URL/i.test(message)) return "Source is not a GitHub repository URL.";
  const status = message.match(/GitHub evidence request failed \((\d{3})\)/);
  if (status) return `GitHub repository metadata request failed (HTTP ${status[1]}).`;
  return "GitHub evidence request failed (network or unexpected error).";
}
