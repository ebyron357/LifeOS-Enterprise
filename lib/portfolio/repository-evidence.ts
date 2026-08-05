import type { RepositoryClassification, RepositoryEvidence, RepositoryMappingProposal } from "./types";
import { sanitizeImportedText } from "./sanitize";

/**
 * Injectable client so the evidence-gathering logic below is unit-testable
 * without any live network access. `createGithubRestClient` is the real
 * adapter; tests supply a fake implementing the same shape.
 */
export interface RepositoryEvidenceClient {
  getRepository(fullName: string): Promise<{
    exists: boolean;
    isArchived: boolean;
    isPrivate: boolean | null;
    description: string;
    pushedAt: string | null;
    createdAt: string | null;
  }>;
  getOpenIssueCount(fullName: string): Promise<number | null>;
  getOpenPullRequestCount(fullName: string): Promise<number | null>;
  getLatestWorkflowConclusion(fullName: string): Promise<string | null>;
  getReadmeExcerpt(fullName: string): Promise<string>;
}

const GITHUB_API = "https://api.github.com";

/**
 * Real GitHub REST v3 adapter. Uses only `repo`-scoped read endpoints
 * (repository metadata, issues, pulls, actions runs, README contents) —
 * none of this requires the GitHub Projects v2 `project` OAuth scope.
 */
export function createGithubRestClient(token?: string): RepositoryEvidenceClient {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  async function get<T>(path: string): Promise<{ ok: boolean; status: number; data: T | null }> {
    const response = await fetch(`${GITHUB_API}${path}`, { headers, cache: "no-store" });
    const data = (await response.json().catch(() => null)) as T | null;
    return { ok: response.ok, status: response.status, data };
  }

  return {
    async getRepository(fullName) {
      const { ok, data } = await get<{
        archived: boolean;
        private: boolean;
        description: string | null;
        pushed_at: string | null;
        created_at: string | null;
      }>(`/repos/${fullName}`);
      if (!ok || !data) {
        return { exists: false, isArchived: false, isPrivate: null, description: "", pushedAt: null, createdAt: null };
      }
      return {
        exists: true,
        isArchived: Boolean(data.archived),
        isPrivate: Boolean(data.private),
        description: data.description ?? "",
        pushedAt: data.pushed_at,
        createdAt: data.created_at,
      };
    },

    async getOpenIssueCount(fullName) {
      const { ok, data } = await get<Array<{ pull_request?: unknown }>>(`/repos/${fullName}/issues?state=open&per_page=100`);
      if (!ok || !Array.isArray(data)) return null;
      return data.filter((item) => !item.pull_request).length;
    },

    async getOpenPullRequestCount(fullName) {
      const { ok, data } = await get<unknown[]>(`/repos/${fullName}/pulls?state=open&per_page=100`);
      if (!ok || !Array.isArray(data)) return null;
      return data.length;
    },

    async getLatestWorkflowConclusion(fullName) {
      const { ok, data } = await get<{ workflow_runs: Array<{ status: string; conclusion: string | null }> }>(
        `/repos/${fullName}/actions/runs?per_page=5`,
      );
      if (!ok || !data) return null;
      const completed = data.workflow_runs.find((run) => run.status === "completed");
      return completed?.conclusion ?? null;
    },

    async getReadmeExcerpt(fullName) {
      const { ok, data } = await get<{ content: string; encoding: string }>(`/repos/${fullName}/readme`);
      if (!ok || !data?.content) return "";
      try {
        const decoded = Buffer.from(data.content, data.encoding === "base64" ? "base64" : "utf8").toString("utf8");
        return sanitizeImportedText(decoded).text;
      } catch {
        return "";
      }
    },
  };
}

export async function gatherRepositoryEvidence(
  fullName: string,
  client: RepositoryEvidenceClient,
): Promise<RepositoryEvidence> {
  try {
    const [repo, openIssues, openPulls, workflowConclusion, readme] = await Promise.all([
      client.getRepository(fullName),
      client.getOpenIssueCount(fullName),
      client.getOpenPullRequestCount(fullName),
      client.getLatestWorkflowConclusion(fullName),
      client.getReadmeExcerpt(fullName),
    ]);

    return {
      fullName,
      exists: repo.exists,
      isArchived: repo.isArchived,
      isPrivate: repo.isPrivate,
      description: repo.description,
      pushedAt: repo.pushedAt,
      createdAt: repo.createdAt,
      openIssueCount: openIssues,
      openPullRequestCount: openPulls,
      latestWorkflowConclusion: workflowConclusion,
      readmeExcerpt: readme,
      fetchError: null,
    };
  } catch (error) {
    return {
      fullName,
      exists: false,
      isArchived: false,
      isPrivate: null,
      description: "",
      pushedAt: null,
      createdAt: null,
      openIssueCount: null,
      openPullRequestCount: null,
      latestWorkflowConclusion: null,
      readmeExcerpt: "",
      fetchError: error instanceof Error ? error.message : "Unknown evidence-gathering error",
    };
  }
}

const STALE_PUSH_DAYS = 60;

function daysSince(dateIso: string | null, now: Date): number | null {
  if (!dateIso) return null;
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return null;
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Classifies a single repository given real evidence. Never returns
 * "Canonical" purely from the registry's own claim — that requires the
 * repository to actually exist and not be archived. Anything uncertain
 * degrades to "Unknown" plus a human-review flag rather than guessing.
 */
export function classifyRepository(
  fullName: string,
  registryClaim: "active" | "archive-candidate" | "unclaimed",
  evidence: RepositoryEvidence,
  now: Date = new Date(),
): RepositoryMappingProposal {
  const evidenceLines: string[] = [];
  let classification: RepositoryClassification = "Unknown";
  let confidence: RepositoryMappingProposal["confidence"] = "Low";
  let reason = "";
  let humanReviewRequired = true;

  if (evidence.fetchError) {
    evidenceLines.push(`fetch error: ${evidence.fetchError}`);
    return {
      project: fullName,
      currentMapping: registryClaim,
      proposedMapping: "Unknown",
      classification: "Unknown",
      evidence: evidenceLines,
      confidence: "Low",
      reason: "Repository evidence could not be retrieved; no automatic classification is safe.",
      humanReviewRequired: true,
    };
  }

  if (!evidence.exists) {
    evidenceLines.push("GitHub API reports repository does not exist or is inaccessible with current credentials.");
    return {
      project: fullName,
      currentMapping: registryClaim,
      proposedMapping: "Unknown",
      classification: "Unknown",
      evidence: evidenceLines,
      confidence: "Medium",
      reason: "Registry references a repository that could not be found. Requires human confirmation (renamed, deleted, or private beyond current token access).",
      humanReviewRequired: true,
    };
  }

  const pushAgeDays = daysSince(evidence.pushedAt, now);
  if (pushAgeDays !== null) evidenceLines.push(`last push ${pushAgeDays.toFixed(0)} days ago`);
  if (evidence.openIssueCount !== null) evidenceLines.push(`${evidence.openIssueCount} open issues`);
  if (evidence.openPullRequestCount !== null) evidenceLines.push(`${evidence.openPullRequestCount} open PRs`);
  if (evidence.latestWorkflowConclusion) evidenceLines.push(`latest CI conclusion: ${evidence.latestWorkflowConclusion}`);
  if (evidence.isArchived) evidenceLines.push("GitHub archived flag is set");

  if (evidence.isArchived) {
    classification = "Archived";
    confidence = "High";
    reason = "Repository is explicitly archived on GitHub.";
    humanReviewRequired = false;
  } else if (registryClaim === "archive-candidate") {
    classification = pushAgeDays !== null && pushAgeDays > STALE_PUSH_DAYS ? "Archive Candidate" : "Duplicate Review";
    confidence = "Medium";
    reason = "Registry lists this repository as a non-active duplicate/reference; evidence does not contradict that.";
    humanReviewRequired = true;
  } else if (registryClaim === "active") {
    classification = pushAgeDays !== null && pushAgeDays <= STALE_PUSH_DAYS ? "Canonical" : "Duplicate Review";
    confidence = pushAgeDays !== null && pushAgeDays <= STALE_PUSH_DAYS ? "Medium" : "Low";
    reason =
      pushAgeDays !== null && pushAgeDays <= STALE_PUSH_DAYS
        ? "Registry claims this is the active repository and it has recent push activity."
        : "Registry claims this is the active repository, but it has had no recent push activity; confirm it is still canonical.";
    humanReviewRequired = pushAgeDays === null || pushAgeDays > STALE_PUSH_DAYS;
  } else {
    classification = "Unknown";
    reason = "No registry claim maps to this repository; found only through direct project-note evidence.";
    humanReviewRequired = true;
  }

  return {
    project: fullName,
    currentMapping: registryClaim,
    proposedMapping: classification,
    classification,
    evidence: evidenceLines,
    confidence,
    reason,
    humanReviewRequired,
  };
}
