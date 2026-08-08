import { describe, expect, it } from "vitest";
import { classifyRepository, gatherRepositoryEvidence, type RepositoryEvidenceClient } from "@/lib/portfolio/repository-evidence";
import type { RepositoryEvidence } from "@/lib/portfolio/types";

function fakeClient(overrides: Partial<RepositoryEvidenceClient> = {}): RepositoryEvidenceClient {
  return {
    getRepository: async () => ({ exists: true, isArchived: false, isPrivate: false, description: "", pushedAt: "2026-07-30T00:00:00Z", createdAt: "2025-01-01T00:00:00Z" }),
    getOpenIssueCount: async () => 0,
    getOpenPullRequestCount: async () => 0,
    getLatestWorkflowConclusion: async () => "success",
    getReadmeExcerpt: async () => "A sample repository.",
    ...overrides,
  };
}

const NOW = new Date("2026-08-01T00:00:00Z");

describe("gatherRepositoryEvidence", () => {
  it("collects all evidence fields from an injectable client (mocked GitHub data, no live network)", async () => {
    const evidence = await gatherRepositoryEvidence("ebyron357/sample-repo", fakeClient());
    expect(evidence.exists).toBe(true);
    expect(evidence.openIssueCount).toBe(0);
    expect(evidence.latestWorkflowConclusion).toBe("success");
    expect(evidence.fetchError).toBeNull();
  });

  it("test case 12: records a fetch/permission error instead of throwing when the client rejects", async () => {
    const evidence = await gatherRepositoryEvidence(
      "ebyron357/private-repo",
      fakeClient({ getRepository: async () => { const error = new Error("Resource not accessible by integration") as Error & { status?: number }; error.status = 403; throw error; } }),
    );
    expect(evidence.exists).toBe(false);
    expect(evidence.fetchError).toMatch(/not accessible/i);
  });
});

describe("classifyRepository", () => {
  it("test case 5: an archived repository is classified Archived with high confidence and no human review required", () => {
    const evidence: RepositoryEvidence = {
      fullName: "ebyron357/old-repo",
      exists: true,
      isArchived: true,
      isPrivate: false,
      description: "",
      pushedAt: "2025-01-01T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      openIssueCount: 0,
      openPullRequestCount: 0,
      latestWorkflowConclusion: null,
      readmeExcerpt: "",
      fetchError: null,
    };
    const proposal = classifyRepository("ebyron357/old-repo", "unclaimed", evidence, NOW);
    expect(proposal.classification).toBe("Archived");
    expect(proposal.confidence).toBe("High");
    expect(proposal.humanReviewRequired).toBe(false);
  });

  it("test case 6: a registry-listed archive/reference repo is a duplicate-review candidate", () => {
    const evidence: RepositoryEvidence = {
      fullName: "ebyron357/reference-repo",
      exists: true,
      isArchived: false,
      isPrivate: false,
      description: "",
      pushedAt: "2026-07-20T00:00:00Z",
      createdAt: "2025-01-01T00:00:00Z",
      openIssueCount: 1,
      openPullRequestCount: 0,
      latestWorkflowConclusion: "success",
      readmeExcerpt: "",
      fetchError: null,
    };
    const proposal = classifyRepository("ebyron357/reference-repo", "archive-candidate", evidence, NOW);
    expect(proposal.classification).toBe("Duplicate Review");
    expect(proposal.humanReviewRequired).toBe(true);
  });

  it("test case 7: a stale registry entry (active claim, but no push in 60+ days) is downgraded for human review", () => {
    const evidence: RepositoryEvidence = {
      fullName: "ebyron357/stale-repo",
      exists: true,
      isArchived: false,
      isPrivate: false,
      description: "",
      pushedAt: "2026-01-01T00:00:00Z",
      createdAt: "2025-01-01T00:00:00Z",
      openIssueCount: 0,
      openPullRequestCount: 0,
      latestWorkflowConclusion: null,
      readmeExcerpt: "",
      fetchError: null,
    };
    const proposal = classifyRepository("ebyron357/stale-repo", "active", evidence, NOW);
    expect(proposal.classification).toBe("Duplicate Review");
    expect(proposal.humanReviewRequired).toBe(true);
    expect(proposal.confidence).toBe("Low");
  });

  it("classifies a registry 'active' repo with recent pushes as Canonical", () => {
    const evidence: RepositoryEvidence = {
      fullName: "ebyron357/active-repo",
      exists: true,
      isArchived: false,
      isPrivate: false,
      description: "",
      pushedAt: "2026-07-25T00:00:00Z",
      createdAt: "2025-01-01T00:00:00Z",
      openIssueCount: 2,
      openPullRequestCount: 1,
      latestWorkflowConclusion: "success",
      readmeExcerpt: "",
      fetchError: null,
    };
    const proposal = classifyRepository("ebyron357/active-repo", "active", evidence, NOW);
    expect(proposal.classification).toBe("Canonical");
    expect(proposal.humanReviewRequired).toBe(false);
  });

  it("never guesses Canonical for a repository that does not exist", () => {
    const evidence: RepositoryEvidence = {
      fullName: "ebyron357/missing-repo",
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
      fetchError: null,
    };
    const proposal = classifyRepository("ebyron357/missing-repo", "active", evidence, NOW);
    expect(proposal.classification).toBe("Unknown");
    expect(proposal.humanReviewRequired).toBe(true);
  });

  it("degrades to Unknown and requires review when evidence could not be retrieved at all", () => {
    const evidence: RepositoryEvidence = {
      fullName: "ebyron357/error-repo",
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
      fetchError: "network timeout",
    };
    const proposal = classifyRepository("ebyron357/error-repo", "active", evidence, NOW);
    expect(proposal.classification).toBe("Unknown");
    expect(proposal.confidence).toBe("Low");
    expect(proposal.humanReviewRequired).toBe(true);
  });
});
