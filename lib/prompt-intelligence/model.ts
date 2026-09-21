import { createHash } from "node:crypto";
import { parseFrontmatter, frontmatterString, frontmatterTags } from "@/lib/vault/parse-frontmatter";
import { containsRawPlaceholder } from "@/lib/os/templates";

export const PROMPT_FOLDER = "40 Resources/Prompts";

export const PROMPT_RESULT_STATUSES = ["UNTESTED", "USED", "PASS", "PARTIAL", "FAILED", "SUPERSEDED"] as const;
export type PromptResultStatus = (typeof PROMPT_RESULT_STATUSES)[number];
export type PromptPrivacyLevel = "public-safe" | "internal" | "private";

export type PromptRecord = {
  id: string;
  canonicalPromptId: string;
  type: "prompt";
  title: string;
  purpose: string;
  status: string;
  version: string;
  createdAt: string | null;
  updatedAt: string | null;
  lastUsedAt: string | null;
  owner: string | null;
  project: string | null;
  area: string | null;
  client: string | null;
  business: string | null;
  agent: string | null;
  model: string | null;
  provider: string | null;
  tools: string[];
  capabilities: string[];
  tags: string[];
  taskTypes: string[];
  triggerContext: string[];
  recommendedContext: string | null;
  sourcePath: string | null;
  sourceOrigin: string | null;
  supersedes: string | null;
  supersededBy: string | null;
  promptBody: string;
  expectedInput: string | null;
  expectedOutput: string | null;
  constraints: string | null;
  prohibitedActions: string | null;
  evidenceRequired: string | null;
  usageCount: number | null;
  successCount: number | null;
  failureCount: number | null;
  lastResult: string | null;
  lastResultStatus: PromptResultStatus;
  lastEvidence: string | null;
  lastFailure: string | null;
  qualityState: PromptResultStatus;
  reviewDate: string | null;
  privacyLevel: PromptPrivacyLevel;
  sensitivity: string | null;
  allowedDestinations: string[];
  contentIdentity: string;
  path: string;
  current: boolean;
  warnings: string[];
};

export type PromptUsageEvent = {
  usedAt: string;
  project?: string;
  agent?: string;
  model?: string;
  resultStatus: PromptResultStatus;
  evidence?: string;
  failureReason?: string;
};

function compactHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function normalizePromptBody(body: string): string {
  return String(body ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .toLowerCase();
}

export function promptContentIdentity(body: string): string {
  return `prompt-body:${compactHash(normalizePromptBody(body))}`;
}

export function promptSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "prompt";
}

export function canonicalPromptIdFromTitle(title: string): string {
  return `prompt:${promptSlug(title)}`;
}

export function promptRecordId(canonicalPromptId: string, version: string): string {
  return `${canonicalPromptId}@${version || "0"}`;
}

export function isOperationalPromptNote(input: {
  path: string;
  title?: string;
  frontmatter?: Record<string, unknown>;
  section?: string;
}): boolean {
  const path = input.path.toLowerCase();
  if (
    input.section === "templates" ||
    path.includes("/templates/") ||
    path.startsWith("99 templates/") ||
    path.startsWith("templates/")
  ) {
    return false;
  }
  const identity = [
    input.title ?? "",
    String(input.frontmatter?.title ?? ""),
    String(input.frontmatter?.canonical_prompt_id ?? ""),
  ].join(" ");
  return !containsRawPlaceholder(identity) && !containsRawPlaceholder(path);
}

function yamlList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  const text = frontmatterString(value);
  if (!text) return [];
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

function optionalNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalString(value: unknown): string | null {
  const text = frontmatterString(value)?.trim() ?? "";
  return text ? text.replace(/\[\[|\]\]/g, "") : null;
}

function resultStatus(value: unknown, fallback: PromptResultStatus = "UNTESTED"): PromptResultStatus {
  const text = String(value ?? "").toUpperCase();
  return (PROMPT_RESULT_STATUSES as readonly string[]).includes(text) ? (text as PromptResultStatus) : fallback;
}

function privacyLevel(value: unknown): PromptPrivacyLevel {
  const text = String(value ?? "").toLowerCase();
  if (text === "public-safe" || text === "public") return "public-safe";
  if (text === "private") return "private";
  return "internal";
}

export function sectionText(body: string, heading: string): string {
  const match = body.match(new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?=\\n## |$)`, "i"));
  return match?.[1]?.trim() ?? "";
}

export function extractPromptBody(body: string): string {
  const section = sectionText(body, "Prompt");
  const fenced = section.match(/```(?:text|markdown|md)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  if (section) return section.replace(/^```(?:text|markdown|md)?\s*/i, "").replace(/```$/, "").trim();
  return body.replace(/^#\s+.+\n+/, "").trim();
}

export function parsePromptFromFields(
  path: string,
  frontmatter: Record<string, unknown>,
  body: string,
  titleHint?: string,
): PromptRecord | null {
  const type = String(frontmatter.type ?? "").toLowerCase();
  if (type && type !== "prompt") return null;
  if (!isOperationalPromptNote({ path, title: titleHint, frontmatter })) return null;

  const title = (titleHint || optionalString(frontmatter.title) || path.split("/").pop()?.replace(/\.md$/i, "") || "Untitled prompt").trim();
  const promptBody = extractPromptBody(body);
  if (!promptBody) return null;

  const version = optionalString(frontmatter.version) || "1.0";
  const canonicalPromptId = optionalString(frontmatter.canonical_prompt_id) || canonicalPromptIdFromTitle(title);
  const supersededBy = optionalString(frontmatter.superseded_by);
  const lastResultStatus = resultStatus(frontmatter.last_result_status, supersededBy ? "SUPERSEDED" : "UNTESTED");
  const lastFailure = optionalString(frontmatter.last_failure);
  const warnings: string[] = [];
  if (lastResultStatus === "FAILED" || lastFailure) {
    warnings.push(lastFailure ? `Known failure: ${lastFailure}` : "This prompt has failure evidence. Do not reuse it blindly.");
  }
  if (supersededBy) {
    warnings.push(`Superseded by ${supersededBy}.`);
  }

  return {
    id: promptRecordId(canonicalPromptId, version),
    canonicalPromptId,
    type: "prompt",
    title,
    purpose: optionalString(frontmatter.purpose) || sectionText(body, "Purpose") || "",
    status: optionalString(frontmatter.status) || "draft",
    version,
    createdAt: optionalString(frontmatter.created) || optionalString(frontmatter.created_at),
    updatedAt: optionalString(frontmatter.updated) || optionalString(frontmatter.updated_at),
    lastUsedAt: optionalString(frontmatter.last_used_at),
    owner: optionalString(frontmatter.owner),
    project: optionalString(frontmatter.project),
    area: optionalString(frontmatter.area),
    client: optionalString(frontmatter.client),
    business: optionalString(frontmatter.business),
    agent: optionalString(frontmatter.agent),
    model: optionalString(frontmatter.model),
    provider: optionalString(frontmatter.provider),
    tools: yamlList(frontmatter.tools),
    capabilities: yamlList(frontmatter.capabilities),
    tags: frontmatterTags(frontmatter.tags),
    taskTypes: yamlList(frontmatter.task_types),
    triggerContext: yamlList(frontmatter.trigger_context),
    recommendedContext: optionalString(frontmatter.recommended_context) || sectionText(body, "Recommended context") || null,
    sourcePath: optionalString(frontmatter.source_path),
    sourceOrigin: optionalString(frontmatter.source_origin),
    supersedes: optionalString(frontmatter.supersedes),
    supersededBy,
    promptBody,
    expectedInput: optionalString(frontmatter.expected_input) || sectionText(body, "Expected input") || sectionText(body, "Inputs") || null,
    expectedOutput: optionalString(frontmatter.expected_output) || sectionText(body, "Expected output") || sectionText(body, "Output") || null,
    constraints: optionalString(frontmatter.constraints) || sectionText(body, "Constraints") || null,
    prohibitedActions: optionalString(frontmatter.prohibited_actions) || sectionText(body, "Prohibited actions") || null,
    evidenceRequired: optionalString(frontmatter.evidence_required) || sectionText(body, "Evidence required") || null,
    usageCount: optionalNumber(frontmatter.usage_count),
    successCount: optionalNumber(frontmatter.success_count),
    failureCount: optionalNumber(frontmatter.failure_count),
    lastResult: optionalString(frontmatter.last_result),
    lastResultStatus,
    lastEvidence: optionalString(frontmatter.last_evidence),
    lastFailure,
    qualityState: resultStatus(frontmatter.quality_state, lastResultStatus),
    reviewDate: optionalString(frontmatter.review_date),
    privacyLevel: privacyLevel(frontmatter.privacy_level),
    sensitivity: optionalString(frontmatter.sensitivity),
    allowedDestinations: yamlList(frontmatter.allowed_destinations),
    contentIdentity: promptContentIdentity(promptBody),
    path,
    current: !supersededBy && lastResultStatus !== "SUPERSEDED",
    warnings,
  };
}

export function parsePromptRecord(path: string, source: string): PromptRecord | null {
  const { frontmatter, body } = parseFrontmatter(source);
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return parsePromptFromFields(path, frontmatter, body, heading);
}

function yamlValue(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return String(value);
}

function yamlInlineList(values: string[]): string {
  return values.length ? `[${values.join(", ")}]` : "";
}

export function renderPromptRecord(record: Omit<PromptRecord, "id" | "contentIdentity" | "current" | "warnings" | "type"> & { type?: "prompt" }): string {
  return `---
type: prompt
title: ${record.title}
purpose: ${yamlValue(record.purpose)}
status: ${yamlValue(record.status) || "draft"}
version: ${yamlValue(record.version) || "1.0"}
created: ${yamlValue(record.createdAt)}
updated: ${yamlValue(record.updatedAt)}
last_used_at: ${yamlValue(record.lastUsedAt)}
owner: ${yamlValue(record.owner)}
project: ${yamlValue(record.project)}
area: ${yamlValue(record.area)}
client: ${yamlValue(record.client)}
business: ${yamlValue(record.business)}
agent: ${yamlValue(record.agent)}
model: ${yamlValue(record.model)}
provider: ${yamlValue(record.provider)}
tools: ${yamlInlineList(record.tools)}
capabilities: ${yamlInlineList(record.capabilities)}
tags: ${yamlInlineList(record.tags.length ? record.tags : ["prompt"])}
task_types: ${yamlInlineList(record.taskTypes)}
trigger_context: ${yamlInlineList(record.triggerContext)}
recommended_context: ${yamlValue(record.recommendedContext)}
source_path: ${yamlValue(record.sourcePath)}
source_origin: ${yamlValue(record.sourceOrigin)}
canonical_prompt_id: ${yamlValue(record.canonicalPromptId)}
supersedes: ${yamlValue(record.supersedes)}
superseded_by: ${yamlValue(record.supersededBy)}
usage_count: ${record.usageCount ?? ""}
success_count: ${record.successCount ?? ""}
failure_count: ${record.failureCount ?? ""}
last_result: ${yamlValue(record.lastResult)}
last_result_status: ${record.lastResultStatus}
last_evidence: ${yamlValue(record.lastEvidence)}
last_failure: ${yamlValue(record.lastFailure)}
quality_state: ${record.qualityState}
review_date: ${yamlValue(record.reviewDate)}
privacy_level: ${record.privacyLevel}
sensitivity: ${yamlValue(record.sensitivity)}
allowed_destinations: ${yamlInlineList(record.allowedDestinations)}
---

# ${record.title}

## Purpose

${record.purpose || "-"}

## Recommended context

${record.recommendedContext || "-"}

## Expected input

${record.expectedInput || "-"}

## Expected output

${record.expectedOutput || "-"}

## Constraints

${record.constraints || "-"}

## Prohibited actions

${record.prohibitedActions || "-"}

## Evidence required

${record.evidenceRequired || "-"}

## Prompt

\`\`\`text
${record.promptBody}
\`\`\`
`;
}

export function recordPromptUsage(record: PromptRecord, event: PromptUsageEvent): PromptRecord {
  const usageCount = (record.usageCount ?? 0) + 1;
  const successCount = record.successCount ?? 0;
  const failureCount = record.failureCount ?? 0;
  const passed = event.resultStatus === "PASS";
  const failed = event.resultStatus === "FAILED";
  const next: PromptRecord = {
    ...record,
    lastUsedAt: event.usedAt,
    lastResultStatus: event.resultStatus,
    qualityState: event.resultStatus,
    lastResult: `${event.resultStatus}${event.project ? ` · ${event.project}` : ""}${event.agent ? ` · ${event.agent}` : ""}`,
    lastEvidence: event.evidence ?? record.lastEvidence,
    lastFailure: failed ? (event.failureReason ?? record.lastFailure) : record.lastFailure,
    usageCount,
    successCount: passed ? successCount + 1 : successCount,
    failureCount: failed ? failureCount + 1 : failureCount,
    project: event.project ?? record.project,
    agent: event.agent ?? record.agent,
    model: event.model ?? record.model,
  };
  next.warnings = [];
  if (next.lastResultStatus === "FAILED" || next.lastFailure) {
    next.warnings.push(next.lastFailure ? `Known failure: ${next.lastFailure}` : "This prompt has failure evidence. Do not reuse it blindly.");
  }
  return next;
}
