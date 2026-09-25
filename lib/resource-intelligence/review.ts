import type { VaultNote } from "@/lib/vault/types";
import type { ResourceArchitectureClassification, ResourceDisposition } from "./model";

export const RESOURCE_RECORDS_FOLDER = "40 Resources/Resource Intelligence/Records";

export const REVIEW_ARCHITECTURES: ResourceArchitectureClassification[] = ["PENDING", "PLATFORM", "TEMPLATE", "PROJECT"];
export const REVIEW_DISPOSITIONS: Exclude<ResourceDisposition, "PENDING">[] = [
  "ADOPT",
  "ADAPT",
  "EXTRACT",
  "WATCH",
  "ARCHIVE",
  "REJECT",
];
export const REVIEW_LEVELS = ["low", "medium", "high"] as const;

export type ReviewLevel = (typeof REVIEW_LEVELS)[number];

export type ResourceLane = "review" | "processing" | "implementation" | "watch" | "completed" | "archived";

export const RESOURCE_LANES: Array<{ id: ResourceLane; label: string; description: string }> = [
  { id: "review", label: "Needs review", description: "Captured; architecture and disposition are still PENDING." },
  { id: "processing", label: "Processing", description: "Source evidence is being gathered before a decision." },
  { id: "implementation", label: "Implementation", description: "Reviewed as ADOPT, ADAPT, or EXTRACT; work is not yet complete." },
  { id: "watch", label: "Watch", description: "Reviewed as WATCH; revisit on the review date." },
  { id: "completed", label: "Completed", description: "Implementation or extraction is recorded as complete." },
  { id: "archived", label: "Archived", description: "Reviewed as ARCHIVE or REJECT." },
];

export type ResourceRecordView = {
  path: string;
  title: string;
  sourceType: string;
  sourceIdentity: string;
  canonicalSource: string;
  processingState: string;
  architecture: ResourceArchitectureClassification;
  disposition: ResourceDisposition;
  captureCount: number;
  lastCaptured: string | null;
  reviewDate: string | null;
  reviewDue: boolean;
  lane: ResourceLane;
};

export type ResourceReviewDecision = {
  architectureClassification: ResourceArchitectureClassification;
  disposition: Exclude<ResourceDisposition, "PENDING">;
  rationale: string;
  evidence?: string;
  overlap?: string;
  value?: ReviewLevel;
  effort?: ReviewLevel;
  risk?: ReviewLevel;
  license?: string;
  cost?: string;
  reviewer?: string;
  nextReviewDate?: string;
  revise?: boolean;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RECORD_PATH_PATTERN = /^40 Resources\/Resource Intelligence\/Records\/[a-z0-9][a-z0-9-]{0,127}\.md$/;
const IMPLEMENTATION_DISPOSITIONS = new Set<ResourceDisposition>(["ADOPT", "ADAPT", "EXTRACT"]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function upper<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const candidate = text(value).toUpperCase() as T;
  return allowed.includes(candidate) ? candidate : fallback;
}

export function isResourceRecordPath(path: string): boolean {
  return RECORD_PATH_PATTERN.test(path) && !path.includes("..");
}

export function resourceLane(
  disposition: ResourceDisposition,
  processingState: string,
): ResourceLane {
  const state = processingState.toLowerCase();
  if (state === "completed") return "completed";
  if (disposition === "PENDING") return state === "processing" ? "processing" : "review";
  if (IMPLEMENTATION_DISPOSITIONS.has(disposition)) return "implementation";
  if (disposition === "WATCH") return "watch";
  return "archived";
}

export function isResourceRecordNote(note: Pick<VaultNote, "type" | "path" | "frontmatter">): boolean {
  return note.type === "resource"
    && note.path.startsWith(`${RESOURCE_RECORDS_FOLDER}/`)
    && Boolean(text(note.frontmatter.source_identity));
}

export function catalogResourceRecords(notes: VaultNote[], today: string): ResourceRecordView[] {
  return notes
    .filter(isResourceRecordNote)
    .map((note) => {
      const fm = note.frontmatter;
      const disposition = upper<ResourceDisposition>(
        fm.disposition,
        ["PENDING", ...REVIEW_DISPOSITIONS],
        "PENDING",
      );
      const architecture = upper(fm.architecture_classification, REVIEW_ARCHITECTURES, "PENDING");
      const processingState = text(fm.processing_state) || "needs-review";
      const lane = resourceLane(disposition, processingState);
      const reviewDate = text(fm.review_date) || note.reviewDate;
      const count = Number(fm.capture_count);
      return {
        path: note.path,
        title: note.title,
        sourceType: text(fm.source_type) || "unknown",
        sourceIdentity: text(fm.source_identity),
        canonicalSource: text(fm.canonical_source),
        processingState,
        architecture,
        disposition,
        captureCount: Number.isFinite(count) && count > 0 ? count : 1,
        lastCaptured: text(fm.last_captured) || null,
        reviewDate: reviewDate || null,
        reviewDue: Boolean(reviewDate && DATE_PATTERN.test(reviewDate.slice(0, 10)) && reviewDate.slice(0, 10) <= today
          && (lane === "review" || lane === "processing" || lane === "watch")),
        lane,
      } satisfies ResourceRecordView;
    })
    .sort((a, b) => Number(b.reviewDue) - Number(a.reviewDue)
      || (a.reviewDate ?? "9999").localeCompare(b.reviewDate ?? "9999")
      || a.title.localeCompare(b.title));
}

export function groupResourcesByLane(records: ResourceRecordView[]): Record<ResourceLane, ResourceRecordView[]> {
  const groups = Object.fromEntries(RESOURCE_LANES.map((lane) => [lane.id, [] as ResourceRecordView[]])) as Record<
    ResourceLane,
    ResourceRecordView[]
  >;
  for (const record of records) groups[record.lane].push(record);
  return groups;
}

export type ResourceDuplicateCandidate = {
  left: ResourceRecordView;
  right: ResourceRecordView;
  score: number;
  reason: string;
};

const TITLE_STOP_WORDS = new Set(["the", "a", "an", "and", "for", "of", "to", "in", "on", "with", "youtube", "github"]);

function titleTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 1 && !TITLE_STOP_WORDS.has(token)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function githubRepositoryName(record: ResourceRecordView): string | null {
  const match = record.sourceIdentity.match(/^github:[^/]+\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * Suggests possible duplicates across different exact identities. Suggestions only:
 * nothing is merged, and the owner decides whether two records describe the same thing.
 */
export function resourceDuplicateCandidates(
  records: ResourceRecordView[],
  threshold = 0.6,
): ResourceDuplicateCandidate[] {
  const candidates: ResourceDuplicateCandidate[] = [];
  const tokens = records.map((record) => titleTokens(record.title));

  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const left = records[i];
      const right = records[j];
      if (left.sourceIdentity === right.sourceIdentity) continue;

      const leftRepo = githubRepositoryName(left);
      const rightRepo = githubRepositoryName(right);
      if (leftRepo && rightRepo && leftRepo === rightRepo) {
        candidates.push({ left, right, score: 1, reason: `Same GitHub repository name "${leftRepo}" under different owners (possible fork).` });
        continue;
      }

      const score = jaccard(tokens[i], tokens[j]);
      if (score >= threshold) {
        candidates.push({ left, right, score: Math.round(score * 100) / 100, reason: `Titles share ${Math.round(score * 100)}% of their words.` });
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score || a.left.title.localeCompare(b.left.title));
}

function singleLine(value: unknown, max: number): string {
  return text(value).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").slice(0, max);
}

function level(value: unknown): ReviewLevel | undefined {
  const candidate = text(value).toLowerCase();
  return (REVIEW_LEVELS as readonly string[]).includes(candidate) ? (candidate as ReviewLevel) : undefined;
}

export function parseReviewDecision(input: unknown): { ok: true; decision: ResourceReviewDecision } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Review decision is required." };
  const raw = input as Record<string, unknown>;

  const disposition = text(raw.disposition).toUpperCase();
  if (!(REVIEW_DISPOSITIONS as string[]).includes(disposition)) {
    return { ok: false, error: `disposition must be one of ${REVIEW_DISPOSITIONS.join(", ")}.` };
  }
  const architecture = text(raw.architectureClassification || "PENDING").toUpperCase();
  if (!(REVIEW_ARCHITECTURES as string[]).includes(architecture)) {
    return { ok: false, error: `architectureClassification must be one of ${REVIEW_ARCHITECTURES.join(", ")}.` };
  }
  const rationale = singleLine(raw.rationale, 1000);
  if (rationale.length < 12) {
    return { ok: false, error: "A source-grounded rationale of at least 12 characters is required." };
  }
  if ((disposition === "ADOPT" || disposition === "ADAPT") && architecture === "PENDING") {
    return { ok: false, error: "ADOPT and ADAPT require a PLATFORM, TEMPLATE, or PROJECT architecture classification." };
  }
  const nextReviewDate = text(raw.nextReviewDate);
  if (nextReviewDate && !DATE_PATTERN.test(nextReviewDate)) {
    return { ok: false, error: "nextReviewDate must use YYYY-MM-DD." };
  }
  if (disposition === "WATCH" && !nextReviewDate) {
    return { ok: false, error: "WATCH requires a nextReviewDate." };
  }

  return {
    ok: true,
    decision: {
      architectureClassification: architecture as ResourceArchitectureClassification,
      disposition: disposition as ResourceReviewDecision["disposition"],
      rationale,
      evidence: singleLine(raw.evidence, 1000) || undefined,
      overlap: singleLine(raw.overlap, 300) || undefined,
      value: level(raw.value),
      effort: level(raw.effort),
      risk: level(raw.risk),
      license: singleLine(raw.license, 120) || undefined,
      cost: singleLine(raw.cost, 120) || undefined,
      reviewer: singleLine(raw.reviewer, 80) || undefined,
      nextReviewDate: nextReviewDate || undefined,
      revise: raw.revise === true,
    },
  };
}

function frontmatterBounds(markdown: string): { start: number; end: number } | null {
  if (!markdown.startsWith("---\n")) return null;
  const end = markdown.indexOf("\n---", 4);
  return end === -1 ? null : { start: 4, end };
}

function frontmatterValue(markdown: string, key: string): string | null {
  const bounds = frontmatterBounds(markdown);
  if (!bounds) return null;
  const block = markdown.slice(bounds.start, bounds.end);
  const match = block.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  if (!match) return null;
  const raw = match[1].trim();
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return raw.replace(/^["']|["']$/g, "");
  }
}

function upsertFrontmatter(markdown: string, key: string, value: string): string {
  const bounds = frontmatterBounds(markdown);
  if (!bounds) throw new Error("Resource record is missing frontmatter.");
  const line = `${key}: ${JSON.stringify(value)}`;
  const block = markdown.slice(bounds.start, bounds.end);
  const pattern = new RegExp(`^${key}:.*$`, "m");
  const nextBlock = pattern.test(block) ? block.replace(pattern, () => line) : `${block}\n${line}`;
  return markdown.slice(0, bounds.start) + nextBlock + markdown.slice(bounds.end);
}

function replaceEvaluationLine(markdown: string, label: string, value: string): string {
  const pattern = new RegExp(`^- ${label}:.*$`, "m");
  return pattern.test(markdown) ? markdown.replace(pattern, () => `- ${label}: ${value}`) : markdown;
}

function nextActionFor(decision: ResourceReviewDecision): string {
  switch (decision.disposition) {
    case "ADOPT":
      return `Plan adoption as ${decision.architectureClassification} through a governed change; do not implement without an approved plan.`;
    case "ADAPT":
      return `Plan the ${decision.architectureClassification} adaptation and record what is kept, changed, and excluded.`;
    case "EXTRACT":
      return "Extract the reusable asset into its canonical home (for prompts: 40 Resources/Prompts) and link it here.";
    case "WATCH":
      return `Revisit on ${decision.nextReviewDate} for changes in maturity, license, or relevance.`;
    case "ARCHIVE":
      return "No action. Retained for reference only.";
    case "REJECT":
      return "No action. Rejected; do not re-evaluate unless the source materially changes.";
  }
}

function processingStateFor(disposition: ResourceReviewDecision["disposition"]): string {
  if (IMPLEMENTATION_DISPOSITIONS.has(disposition)) return "implementation";
  if (disposition === "WATCH") return "watch";
  return disposition === "REJECT" ? "rejected" : "archived";
}

function statusFor(disposition: ResourceReviewDecision["disposition"]): string {
  if (IMPLEMENTATION_DISPOSITIONS.has(disposition)) return "active";
  return disposition === "WATCH" ? "watch" : "archived";
}

export function applyResourceReview(
  existing: string,
  decision: ResourceReviewDecision,
  nowIso: string,
): { markdown: string; previousDisposition: ResourceDisposition } {
  if (frontmatterValue(existing, "type") !== "resource" || !frontmatterValue(existing, "source_identity")) {
    throw new Error("Target is not a canonical Resource Intelligence record.");
  }
  const previousDisposition = upper<ResourceDisposition>(
    frontmatterValue(existing, "disposition"),
    ["PENDING", ...REVIEW_DISPOSITIONS],
    "PENDING",
  );
  if (previousDisposition !== "PENDING" && !decision.revise) {
    throw new Error(`Record already reviewed as ${previousDisposition}. Set revise to true to record a revised decision.`);
  }

  const nextAction = nextActionFor(decision);
  let markdown = existing;
  markdown = upsertFrontmatter(markdown, "status", statusFor(decision.disposition));
  markdown = upsertFrontmatter(markdown, "processing_state", processingStateFor(decision.disposition));
  markdown = upsertFrontmatter(markdown, "architecture_classification", decision.architectureClassification);
  markdown = upsertFrontmatter(markdown, "disposition", decision.disposition);
  markdown = upsertFrontmatter(markdown, "reviewed_at", nowIso);
  if (decision.reviewer) markdown = upsertFrontmatter(markdown, "reviewed_by", decision.reviewer);
  if (decision.nextReviewDate) markdown = upsertFrontmatter(markdown, "review_date", decision.nextReviewDate);
  if (decision.value) markdown = upsertFrontmatter(markdown, "value_rating", decision.value);
  if (decision.effort) markdown = upsertFrontmatter(markdown, "effort_rating", decision.effort);
  if (decision.risk) markdown = upsertFrontmatter(markdown, "risk_rating", decision.risk);
  if (decision.license) markdown = upsertFrontmatter(markdown, "license_review", decision.license);
  if (decision.cost) markdown = upsertFrontmatter(markdown, "cost_review", decision.cost);
  if (decision.overlap) markdown = upsertFrontmatter(markdown, "stack_overlap", decision.overlap);
  markdown = upsertFrontmatter(markdown, "next_action", nextAction);

  markdown = replaceEvaluationLine(markdown, "Architecture classification", `**${decision.architectureClassification}**`);
  markdown = replaceEvaluationLine(markdown, "Disposition", `**${decision.disposition}**`);
  markdown = replaceEvaluationLine(markdown, "Evidence", decision.evidence || decision.rationale);
  markdown = replaceEvaluationLine(markdown, "Next action", nextAction);

  const ratings = [
    decision.value ? `value ${decision.value}` : null,
    decision.effort ? `effort ${decision.effort}` : null,
    decision.risk ? `risk ${decision.risk}` : null,
    decision.license ? `license ${decision.license}` : null,
    decision.cost ? `cost ${decision.cost}` : null,
    decision.overlap ? `overlap ${decision.overlap}` : null,
  ].filter(Boolean);
  const historyLine = [
    `- ${nowIso} — ${previousDisposition === "PENDING" ? "reviewed" : `revised from ${previousDisposition}`}`,
    ` as ${decision.architectureClassification} / ${decision.disposition}`,
    decision.reviewer ? ` by ${decision.reviewer}` : "",
    `. Rationale: ${decision.rationale}`,
    ratings.length ? ` Ratings: ${ratings.join("; ")}.` : "",
  ].join("");

  if (markdown.includes("## Review History\n")) {
    markdown = markdown.replace("## Review History\n", () => `## Review History\n\n${historyLine}\n`);
  } else if (markdown.includes("\n## Governance")) {
    markdown = markdown.replace("\n## Governance", () => `\n## Review History\n\n${historyLine}\n\n## Governance`);
  } else {
    markdown = `${markdown.replace(/\s*$/, "")}\n\n## Review History\n\n${historyLine}\n`;
  }

  return { markdown, previousDisposition };
}
