import { createHash } from "node:crypto";
import { parseFrontmatter } from "@/lib/vault/parse-frontmatter";
import type { ContinuityCheckpointInput } from "./model";
import type { ResumePackage } from "./model";

export const CHECKPOINT_FOLDER = "Command Center/Checkpoints";

export function checkpointRecordPath(capturedAt: string, project: string): string {
  const day = capturedAt.slice(0, 10) || "undated";
  const slug = project
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "session";
  const stamp = createHash("sha256").update(`${capturedAt}:${project}`).digest("hex").slice(0, 8);
  return `${CHECKPOINT_FOLDER}/${day}-${slug}-${stamp}.md`;
}

function listFromSection(body: string, heading: string): string[] {
  const match = body.match(new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?=\\n## |$)`, "i"));
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => line && line.toLowerCase() !== "none");
}

function firstLine(body: string, heading: string): string {
  return listFromSection(body, heading)[0] ?? "";
}

export function parseCheckpointFromFields(
  path: string,
  frontmatter: Record<string, unknown>,
  body: string,
): ContinuityCheckpointInput | null {
  const type = String(frontmatter.type ?? "").toLowerCase();
  if (type && type !== "checkpoint") return null;
  if (/\{\{[^}]+\}\}/.test(`${frontmatter.title ?? ""} ${body}`)) return null;

  const sessionStatus = String(frontmatter.session_status ?? firstLine(body, "SESSION STATUS") ?? "OPEN").toUpperCase();
  return {
    path,
    title: String(frontmatter.title ?? path.split("/").pop()?.replace(/\.md$/i, "") ?? "Checkpoint"),
    capturedAt: String(frontmatter.captured_at ?? frontmatter.date ?? ""),
    project: String(frontmatter.project ?? "").replace(/\[\[|\]\]/g, ""),
    lastCompleted: String(frontmatter.last_completed ?? firstLine(body, "LAST COMPLETED") ?? ""),
    currentState: String(frontmatter.current_state ?? firstLine(body, "CURRENT STATE") ?? ""),
    nextAction: String(frontmatter.next_action ?? firstLine(body, "NEXT ACTION") ?? ""),
    owner: String(frontmatter.owner ?? ""),
    sourceOfTruth: String(frontmatter.source_of_truth ?? firstLine(body, "SOURCE OF TRUTH") ?? ""),
    blocker: String(frontmatter.blocker ?? firstLine(body, "BLOCKER") ?? ""),
    doNotRepeat: listFromSection(body, "DO NOT REPEAT"),
    evidence: listFromSection(body, "EVIDENCE"),
    sessionStatus: sessionStatus.startsWith("CLOSED") ? "CLOSED" : "OPEN",
  };
}

export function parseCheckpointRecord(path: string, source: string): ContinuityCheckpointInput | null {
  const { frontmatter, body } = parseFrontmatter(source);
  return parseCheckpointFromFields(path, frontmatter, body);
}

function oneLine(value: string, max = 500): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function yamlValue(value: string): string {
  return JSON.stringify(oneLine(value));
}

function bullet(value: string): string {
  return `- ${oneLine(value) || "none"}`;
}

function bullets(values: string[]): string {
  const lines = values.map((item) => oneLine(item)).filter(Boolean);
  return lines.length ? lines.map((item) => `- ${item}`).join("\n") : "- none";
}

export function renderCheckpointRecord(input: ContinuityCheckpointInput): string {
  const title = oneLine(input.title, 160) || "Resume checkpoint";
  return `---
type: checkpoint
status: ${input.sessionStatus === "CLOSED" ? "complete" : "active"}
title: ${yamlValue(title)}
project: ${yamlValue(input.project)}
owner: ${yamlValue(input.owner)}
captured_at: ${yamlValue(input.capturedAt)}
last_completed: ${yamlValue(input.lastCompleted)}
current_state: ${yamlValue(input.currentState)}
next_action: ${yamlValue(input.nextAction)}
source_of_truth: ${yamlValue(input.sourceOfTruth)}
blocker: ${yamlValue(input.blocker)}
session_status: ${input.sessionStatus}
review_date: ${yamlValue(input.capturedAt.slice(0, 10))}
tags:
  - checkpoint
  - continuity
---

# ${title}

## LAST COMPLETED
${bullet(input.lastCompleted)}

## CURRENT STATE
${bullet(input.currentState)}

## NEXT ACTION
${bullet(input.nextAction)}

## SOURCE OF TRUTH
${bullet(input.sourceOfTruth)}

## BLOCKER
${bullet(input.blocker)}

## DO NOT REPEAT
${bullets(input.doNotRepeat)}

## EVIDENCE
${bullets(input.evidence)}

## SESSION STATUS
- ${input.sessionStatus}
`;
}

export type CheckpointOverrides = Partial<
  Pick<ContinuityCheckpointInput, "title" | "project" | "lastCompleted" | "currentState" | "nextAction" | "owner" | "blocker" | "sourceOfTruth">
> & { doNotRepeat?: string[]; evidence?: string[]; sessionStatus?: "OPEN" | "CLOSED" };

const OVERRIDE_FIELDS = ["title", "project", "lastCompleted", "currentState", "nextAction", "owner", "blocker", "sourceOfTruth"] as const;

export function parseCheckpointOverrides(input: unknown): { ok: true; overrides: CheckpointOverrides } | { ok: false; error: string } {
  if (input === undefined || input === null) return { ok: true, overrides: {} };
  if (typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "checkpoint must be an object." };
  const raw = input as Record<string, unknown>;
  const overrides: CheckpointOverrides = {};
  for (const field of OVERRIDE_FIELDS) {
    const value = raw[field];
    if (value === undefined) continue;
    if (typeof value !== "string") return { ok: false, error: `${field} must be a string.` };
    const cleaned = oneLine(value);
    if (cleaned) overrides[field] = cleaned;
  }
  for (const field of ["doNotRepeat", "evidence"] as const) {
    const value = raw[field];
    if (value === undefined) continue;
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      return { ok: false, error: `${field} must be a list of strings.` };
    }
    overrides[field] = (value as string[]).map((item) => oneLine(item)).filter(Boolean).slice(0, 20);
  }
  if (raw.sessionStatus !== undefined) {
    const status = String(raw.sessionStatus).toUpperCase();
    if (status !== "OPEN" && status !== "CLOSED") return { ok: false, error: "sessionStatus must be OPEN or CLOSED." };
    overrides.sessionStatus = status;
  }
  return { ok: true, overrides };
}

/** Combines the derived snapshot with owner/agent-supplied fields; the path is always recomputed. */
export function buildCheckpoint(
  snapshot: ContinuityCheckpointInput,
  overrides: CheckpointOverrides,
): ContinuityCheckpointInput {
  const merged: ContinuityCheckpointInput = {
    ...snapshot,
    ...overrides,
    doNotRepeat: overrides.doNotRepeat ?? snapshot.doNotRepeat,
    evidence: overrides.evidence ?? snapshot.evidence,
    sessionStatus: overrides.sessionStatus ?? snapshot.sessionStatus,
  };
  const project = merged.project || "LifeOS";
  return {
    ...merged,
    title: merged.title || `Resume checkpoint — ${project}`,
    path: checkpointRecordPath(merged.capturedAt, project),
  };
}

export function isCheckpointRecordPath(path: string): boolean {
  return new RegExp(`^${CHECKPOINT_FOLDER}/\\d{4}-\\d{2}-\\d{2}-[a-z0-9-]{1,48}-[a-f0-9]{8}\\.md$`).test(path);
}

export function resumePackageToCheckpoint(resume: ResumePackage, capturedAt: string): ContinuityCheckpointInput {
  return {
    path: checkpointRecordPath(capturedAt, resume.focus?.name || "LifeOS"),
    title: `Resume checkpoint — ${resume.focus?.name || "LifeOS"}`,
    capturedAt,
    project: resume.focus?.name || "",
    lastCompleted: resume.whatWasIDoing,
    currentState: resume.whereWasI,
    nextAction: resume.next.detail,
    owner: resume.next.ownership,
    sourceOfTruth: resume.focus?.path || "vault+github derived resume package",
    blocker: resume.needsOwner[0]?.detail || resume.blocked[0]?.detail || "",
    doNotRepeat: resume.doNotRepeat,
    evidence: [
      `source:${resume.source}`,
      ...resume.happenedSince.slice(0, 4),
      ...resume.needsOwner.slice(0, 3).map((item) => `needs_owner:${item.title}`),
      ...resume.agentCanContinue.slice(0, 3).map((item) => `agent:${item.title}`),
    ],
    sessionStatus: "OPEN",
  };
}
