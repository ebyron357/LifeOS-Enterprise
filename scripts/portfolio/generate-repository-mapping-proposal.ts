/**
 * Generates docs/PORTFOLIO_REPOSITORY_MAPPING_PROPOSAL.md from real GitHub
 * evidence (repo metadata, issues, PRs, Actions runs, README) gathered via
 * the `repo`-scoped REST API — no `project` OAuth scope required.
 *
 * This script NEVER writes to PROJECT_REPO_REGISTRY.md. It only produces a
 * proposal document for human review, per the "do not overwrite the
 * registry silently" requirement.
 *
 * Usage: npm run portfolio:mapping-proposal
 * Auth:  set GITHUB_TOKEN, or the script falls back to `gh auth token`.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { classifyRepository, createGithubRestClient, gatherRepositoryEvidence } from "../../lib/portfolio/repository-evidence";
import { parseArchiveCandidates, parseRegistry } from "../../lib/portfolio/registry";

function resolveToken(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

async function main() {
  const token = resolveToken();
  if (!token) {
    console.error("No GitHub token available (GITHUB_TOKEN unset and `gh auth token` failed). Aborting without writing anything.");
    process.exitCode = 1;
    return;
  }

  const registryPath = path.join(process.cwd(), "PROJECT_REPO_REGISTRY.md");
  const registrySource = await readFile(registryPath, "utf8");
  const entries = parseRegistry(registrySource);
  const archiveCandidates = parseArchiveCandidates(registrySource);

  const client = createGithubRestClient(token);
  const rows: string[] = [];
  let humanReviewCount = 0;

  for (const entry of entries) {
    if (!entry.activeRepo) continue;
    const evidence = await gatherRepositoryEvidence(entry.activeRepo, client);
    const claim = entry.sourceSection === "do-not-use" ? "archive-candidate" : "active";
    const proposal = classifyRepository(entry.activeRepo, claim, evidence);
    if (proposal.humanReviewRequired) humanReviewCount += 1;

    rows.push(
      [
        `### ${entry.project} — \`${entry.activeRepo}\``,
        "",
        `- Current mapping: **${claim}** (registry section: ${entry.sourceSection})`,
        `- Proposed classification: **${proposal.classification}** (confidence: ${proposal.confidence})`,
        `- Reason: ${proposal.reason}`,
        `- Evidence: ${proposal.evidence.length ? proposal.evidence.join("; ") : "(none collected)"}`,
        `- Human review required: ${proposal.humanReviewRequired ? "**Yes**" : "No"}`,
        "",
      ].join("\n"),
    );
  }

  for (const repo of archiveCandidates) {
    const evidence = await gatherRepositoryEvidence(repo, client);
    const proposal = classifyRepository(repo, "archive-candidate", evidence);
    if (proposal.humanReviewRequired) humanReviewCount += 1;
    rows.push(
      [
        `### (Do Not Use As Active) — \`${repo}\``,
        "",
        `- Current mapping: **archive-candidate**`,
        `- Proposed classification: **${proposal.classification}** (confidence: ${proposal.confidence})`,
        `- Reason: ${proposal.reason}`,
        `- Evidence: ${proposal.evidence.length ? proposal.evidence.join("; ") : "(none collected)"}`,
        `- Human review required: ${proposal.humanReviewRequired ? "**Yes**" : "No"}`,
        "",
      ].join("\n"),
    );
  }

  const doc = [
    "# Portfolio Repository Mapping Proposal",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This document is generated evidence, not a decision. `PROJECT_REPO_REGISTRY.md` is the baseline and is never overwritten automatically. Every row below records the current registry mapping, the proposed classification, the evidence behind it, and whether a human must review it before anything changes.",
    "",
    `Total registry-derived repositories evaluated: ${rows.length}. Flagged for human review: ${humanReviewCount}.`,
    "",
    "---",
    "",
    ...rows,
  ].join("\n");

  const outPath = path.join(process.cwd(), "docs", "PORTFOLIO_REPOSITORY_MAPPING_PROPOSAL.md");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, doc, "utf8");
  console.log(`Wrote ${outPath} (${rows.length} repositories, ${humanReviewCount} flagged for human review).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
