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

export function renderCheckpointRecord(input: ContinuityCheckpointInput): string {
  return `---
type: checkpoint
status: ${input.sessionStatus === "CLOSED" ? "complete" : "active"}
title: ${input.title}
project: ${input.project}
owner: ${input.owner}
captured_at: ${input.capturedAt}
last_completed: ${input.lastCompleted}
current_state: ${input.currentState}
next_action: ${input.nextAction}
source_of_truth: ${input.sourceOfTruth}
blocker: ${input.blocker}
session_status: ${input.sessionStatus}
review_date: ${input.capturedAt.slice(0, 10)}
tags:
  - checkpoint
  - continuity
---

# ${input.title}

## LAST COMPLETED
- ${input.lastCompleted || "none"}

## CURRENT STATE
- ${input.currentState || "none"}

## NEXT ACTION
- ${input.nextAction || "none"}

## SOURCE OF TRUTH
- ${input.sourceOfTruth || "none"}

## BLOCKER
- ${input.blocker || "none"}

## DO NOT REPEAT
${input.doNotRepeat.length ? input.doNotRepeat.map((item) => `- ${item}`).join("\n") : "- none"}

## EVIDENCE
${input.evidence.length ? input.evidence.map((item) => `- ${item}`).join("\n") : "- none"}

## SESSION STATUS
- ${input.sessionStatus}
`;
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
