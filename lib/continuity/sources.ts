import "server-only";

import { getGitHubHealth } from "@/lib/github/health";
import { getVaultDashboardData } from "@/lib/lifeos/vault-data";
import { getHermesContract } from "@/lib/os/hermes";
import { frontmatterString } from "@/lib/vault/parse-frontmatter";
import { getVaultIndex } from "@/lib/vault/index";
import { parseCheckpointFromFields } from "./checkpoint";
import { deriveResumePackage } from "./derive";
import { isOperationalContinuityNote } from "./notes";
import type { ContinuityInput, ContinuityProjectInput, ContinuityResourceInput, ResumePackage } from "./model";

function sectionLine(body: string, heading: string): string {
  const match = body.match(new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?=\\n## |$)`, "i"));
  if (!match) return "";
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .find((line) => line && line.toLowerCase() !== "none") ?? "";
}

export async function collectContinuityInput(nowIso = new Date().toISOString()): Promise<ContinuityInput> {
  const [vault, github, index] = await Promise.all([
    getVaultDashboardData(new Date(nowIso)),
    getGitHubHealth(),
    getVaultIndex(),
  ]);

  const projects: ContinuityProjectInput[] = vault.projects.map((project) => {
    const note = index.byPath[project.path];
    const frontmatter = note?.frontmatter ?? {};
    return {
      ...project,
      outcome: frontmatterString(frontmatter.outcome) || (note ? sectionLine(note.body, "Outcome") : "") || "",
      assignedAgent: frontmatterString(frontmatter.assigned_agent) || undefined,
      lastVerified: frontmatterString(frontmatter.last_verified) || undefined,
      canonicalRepo: frontmatterString(frontmatter.canonical_repo) || undefined,
    };
  });

  const resources: ContinuityResourceInput[] = index.notes
    .filter((note) => note.type === "resource" && isOperationalContinuityNote(note))
    .map((note) => ({
      name: note.title,
      path: note.path,
      sourceType: frontmatterString(note.frontmatter.source_type) ?? "",
      processingState: frontmatterString(note.frontmatter.processing_state) ?? note.status ?? "",
      disposition: frontmatterString(note.frontmatter.disposition) ?? "",
      architectureClassification: frontmatterString(note.frontmatter.architecture_classification) ?? "",
      nextAction: note.nextAction ?? "",
      owner: note.owner ?? "",
      lastCaptured: frontmatterString(note.frontmatter.last_captured) ?? note.updated ?? "",
    }));

  const checkpoints = index.notes
    .filter((note) => isOperationalContinuityNote(note) && (note.type === "checkpoint" || note.path.startsWith("Command Center/Checkpoints/")))
    .map((note) => parseCheckpointFromFields(note.path, note.frontmatter, note.body))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    nowIso,
    projects,
    resources,
    checkpoints,
    github,
    hermes: getHermesContract(),
  };
}

export async function getContinuityResumePackage(nowIso = new Date().toISOString()): Promise<ResumePackage> {
  return deriveResumePackage(await collectContinuityInput(nowIso));
}
