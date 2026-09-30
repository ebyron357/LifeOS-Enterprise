import { describe, expect, it } from "vitest";
import {
  isPromptLikeResource,
  normalizeResource,
  PROMPT_INTELLIGENCE_FOLDER,
  renderResourceRecord,
  resourceRecordPath,
  updateResourceRecord,
} from "@/lib/resource-intelligence/model";
import { applyResourceReview } from "@/lib/resource-intelligence/review";
import { LEGACY_CAPTURE_NEXT_ACTION } from "@/lib/resource-intelligence/routing";
import type { ResourceSourceEvidence } from "@/lib/resource-intelligence/source-evidence";

const githubInput = { source: "https://github.com/vercel-labs/knowledge-agent-template", title: "Knowledge Agent Template" };

function capturedEvidence(overrides: Partial<Extract<ResourceSourceEvidence, { status: "source-evidence-captured" }>["github"]> = {}, inspectedAt = "2026-09-30T10:00:00.000Z"): ResourceSourceEvidence {
  return {
    status: "source-evidence-captured",
    inspectedAt,
    processor: "github",
    github: {
      repository: "vercel-labs/knowledge-agent-template",
      defaultBranch: "main",
      latestCommitSha: "814711f1cf5632d1a2b3c4d5e6f7a8b9c0d1e2f3",
      latestCommitAt: "2026-09-15T08:10:05Z",
      license: "MIT",
      stars: 100,
      forks: 10,
      archived: false,
      pushedAt: "2026-09-15T08:10:05Z",
      architectureSuggestion: "TEMPLATE",
      ...overrides,
    },
  };
}

function sectionOrder(markdown: string): string[] {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
}

function frontmatterValue(markdown: string, key: string): string | null {
  const match = markdown.match(new RegExp(`^${key}: (.*)$`, "m"));
  return match ? match[1] : null;
}

describe("Resource Intelligence canonical identity", () => {
  it("dedupes GitHub repository URL variants to one identity", () => {
    const first = normalizeResource({ source: "https://github.com/Vercel-Labs/knowledge-agent-template.git?utm_source=test" });
    const second = normalizeResource({
      source: "github.com/vercel-labs/knowledge-agent-template/issues/12",
      title: "A completely different display title",
    });

    expect(first.sourceType).toBe("github");
    expect(first.sourceIdentity).toBe("github:vercel-labs/knowledge-agent-template");
    expect(second.sourceIdentity).toBe(first.sourceIdentity);
    expect(second.canonicalSource).toBe("https://github.com/vercel-labs/knowledge-agent-template");
    expect(resourceRecordPath(second)).toBe(resourceRecordPath(first));
  });

  it("dedupes YouTube URL forms and display titles by video ID", () => {
    const short = normalizeResource({ source: "https://youtu.be/abc123XYZ?si=tracking", title: "First title" });
    const watch = normalizeResource({
      source: "https://www.youtube.com/watch?v=abc123XYZ&utm_source=test",
      title: "Second title",
    });

    expect(short.sourceType).toBe("youtube");
    expect(short.sourceIdentity).toBe("youtube:abc123XYZ");
    expect(watch.sourceIdentity).toBe(short.sourceIdentity);
    expect(watch.canonicalSource).toBe("https://www.youtube.com/watch?v=abc123XYZ");
    expect(resourceRecordPath(watch)).toBe(resourceRecordPath(short));
  });

  it("removes common tracking parameters from webpage identity", () => {
    const resource = normalizeResource({
      source: "https://Example.com/article/?utm_source=newsletter&b=2&a=1#section",
    });

    expect(resource.sourceType).toBe("webpage");
    expect(resource.canonicalSource).toBe("https://example.com/article?a=1&b=2");
    expect(resource.sourceIdentity).toBe("url:https://example.com/article?a=1&b=2");
  });

  it("uses a supplied file hash as the stable metadata identity", () => {
    const hash = "a".repeat(64);
    const resource = normalizeResource({
      source: "",
      fileName: "Report.pdf",
      fileHash: hash,
      fileSize: 1024,
      fileType: "application/pdf",
    });

    expect(resource.sourceType).toBe("file");
    expect(resource.sourceIdentity).toBe(`file:${hash}`);
    expect(resource.canonicalSource).toBe("file:Report.pdf");
  });

  it("preserves reviewed classification/disposition when an exact duplicate is captured again", () => {
    const input = { source: "https://github.com/vercel-labs/knowledge-agent-template", title: "Knowledge Agent Template" };
    const resource = normalizeResource(input);
    let record = renderResourceRecord(input, resource, "2026-09-19T20:00:00.000Z");
    record = record
      .replace('architecture_classification: "PENDING"', 'architecture_classification: "TEMPLATE"')
      .replace('disposition: "PENDING"', 'disposition: "ADAPT"');

    const updated = updateResourceRecord(record, input, resource, "2026-09-19T21:00:00.000Z");

    expect(updated).toContain('architecture_classification: "TEMPLATE"');
    expect(updated).toContain('disposition: "ADAPT"');
    expect(updated).toContain("capture_count: 2");
    expect(updated).toContain("exact identity dedupe matched the canonical record");
  });

  it("renders GitHub source evidence after Evaluation and before Capture History", () => {
    const resource = normalizeResource(githubInput);
    const record = renderResourceRecord(githubInput, resource, "2026-09-30T10:00:01.000Z", { evidence: capturedEvidence() });

    expect(sectionOrder(record)).toEqual(["Source", "Evaluation", "Source Evidence", "Capture History", "Governance"]);
    expect(record).toContain('evidence_status: "source-evidence-captured"');
    expect(record).toContain('evidence_inspected_at: "2026-09-30T10:00:00.000Z"');
    expect(record).toContain("- Inspected at: 2026-09-30T10:00:00.000Z");
    expect(record).toContain("- Default branch: main");
    expect(record).toContain("- Latest commit: 814711f1cf5632d1a2b3c4d5e6f7a8b9c0d1e2f3 (2026-09-15T08:10:05Z)");
    expect(record).toContain("- License: MIT");
    expect(record).toContain("- Stars: 100");
    expect(record).toContain("- Forks: 10");
    expect(record).toContain("- Archived: no");
    expect(record).toContain("- Last push: 2026-09-15T08:10:05Z");
    expect(record).toContain("- Processor architecture suggestion: TEMPLATE");
    expect(record).toContain("- Processor disposition suggestion: PENDING");
    expect(record).toContain("> Source evidence, not a disposition.");
    expect(record).toContain("- Evidence: source evidence captured at intake; see Source Evidence below.");
    expect(record).not.toContain("capture only");
    // Capture-time evidence never becomes a classification or disposition.
    expect(record).toContain('architecture_classification: "PENDING"');
    expect(record).toContain('disposition: "PENDING"');
  });

  it("reports a missing license as none detected", () => {
    const resource = normalizeResource(githubInput);
    const record = renderResourceRecord(githubInput, resource, "2026-09-30T10:00:01.000Z", {
      evidence: capturedEvidence({ license: null, architectureSuggestion: null, archived: true }),
    });

    expect(record).toContain("- License: none detected");
    expect(record).toContain("- Archived: yes");
    expect(record).toContain("- Processor architecture suggestion: none (README evidence does not support a suggestion)");
  });

  it("keeps a capture-only record without a Source Evidence section when no processor ran", () => {
    const input = { source: "https://example.com/article" };
    const record = renderResourceRecord(input, normalizeResource(input), "2026-09-30T10:00:01.000Z");

    expect(record).toContain('evidence_status: "capture-only"');
    expect(record).toContain('evidence_inspected_at: ""');
    expect(record).toContain("- Evidence: capture only; source inspection has not yet been performed.");
    expect(record).not.toContain("## Source Evidence");
  });

  it("writes evidence-unavailable with the safe error summary when the GitHub fetch failed", () => {
    const resource = normalizeResource(githubInput);
    const record = renderResourceRecord(githubInput, resource, "2026-09-30T10:00:01.000Z", {
      evidence: {
        status: "evidence-unavailable",
        inspectedAt: "2026-09-30T10:00:00.000Z",
        processor: "github",
        error: "GitHub repository metadata request failed (HTTP 403).",
      },
    });

    expect(sectionOrder(record)).toEqual(["Source", "Evaluation", "Source Evidence", "Capture History", "Governance"]);
    expect(record).toContain('evidence_status: "evidence-unavailable"');
    expect(record).toContain("- Error: GitHub repository metadata request failed (HTTP 403).");
    expect(record).toContain("- Evidence: capture only; GitHub evidence inspection failed at intake");
    expect(record).not.toContain("- License:");
  });

  it("replaces the Source Evidence section on re-capture and preserves the owner review", () => {
    const resource = normalizeResource(githubInput);
    const captured = renderResourceRecord(githubInput, resource, "2026-09-30T10:00:01.000Z", { evidence: capturedEvidence() });
    const reviewed = applyResourceReview(captured, {
      architectureClassification: "TEMPLATE",
      disposition: "ADAPT",
      rationale: "README explicitly describes a reusable template.",
      evidence: "Owner verified the MIT license and template README.",
    }, "2026-09-30T11:00:00.000Z").markdown;

    const updated = updateResourceRecord(reviewed, githubInput, resource, "2026-09-30T12:00:00.000Z", {
      evidence: capturedEvidence({ latestCommitSha: "fedcba9876543210", stars: 150 }, "2026-09-30T12:00:00.000Z"),
    });

    expect(updated.match(/^## Source Evidence$/gm)).toHaveLength(1);
    expect(updated).toContain("- Latest commit: fedcba9876543210");
    expect(updated).not.toContain("814711f1cf5632d1");
    expect(updated).toContain("- Stars: 150");
    expect(updated).toContain('evidence_inspected_at: "2026-09-30T12:00:00.000Z"');
    expect(updated).toContain("capture_count: 2");
    expect(updated).toContain('architecture_classification: "TEMPLATE"');
    expect(updated).toContain('disposition: "ADAPT"');
    expect(updated).toContain("- Architecture classification: **TEMPLATE**");
    expect(updated).toContain("- Disposition: **ADAPT**");
    expect(updated).toContain("- Evidence: Owner verified the MIT license and template README.");
    expect(updated).toContain('next_action: "Plan the TEMPLATE adaptation and record what is kept, changed, and excluded."');
    expect(updated).toContain("## Review History");
    expect(sectionOrder(updated)).toEqual([
      "Source",
      "Evaluation",
      "Source Evidence",
      "Capture History",
      "Review History",
      "Governance",
    ]);
  });

  it("keeps earlier evidence when a later refresh fails, without duplicating the failure note", () => {
    const resource = normalizeResource(githubInput);
    const captured = renderResourceRecord(githubInput, resource, "2026-09-30T10:00:01.000Z", { evidence: capturedEvidence() });
    const failure = (at: string): ResourceSourceEvidence => ({
      status: "evidence-unavailable",
      inspectedAt: at,
      processor: "github",
      error: "GitHub repository metadata request failed (HTTP 502).",
    });

    const once = updateResourceRecord(captured, githubInput, resource, "2026-09-30T12:00:00.000Z", { evidence: failure("2026-09-30T12:00:00.000Z") });
    const twice = updateResourceRecord(once, githubInput, resource, "2026-09-30T13:00:00.000Z", { evidence: failure("2026-09-30T13:00:00.000Z") });

    expect(twice).toContain('evidence_status: "source-evidence-captured"');
    expect(twice).toContain('evidence_inspected_at: "2026-09-30T10:00:00.000Z"');
    expect(twice).toContain("- License: MIT");
    expect(twice.match(/^- Latest refresh attempt:/gm)).toHaveLength(1);
    expect(twice).toContain("- Latest refresh attempt: 2026-09-30T13:00:00.000Z failed: GitHub repository metadata request failed (HTTP 502).");
    expect(twice.match(/^## Source Evidence$/gm)).toHaveLength(1);
    expect(twice).toContain("capture_count: 3");

    const refreshed = updateResourceRecord(twice, githubInput, resource, "2026-09-30T14:00:00.000Z", {
      evidence: capturedEvidence({}, "2026-09-30T14:00:00.000Z"),
    });
    expect(refreshed).not.toContain("Latest refresh attempt");
    expect(refreshed).toContain('evidence_inspected_at: "2026-09-30T14:00:00.000Z"');
  });

  it("adds routing and evidence fields to a record captured before they existed", () => {
    const resource = normalizeResource(githubInput);
    const legacy = renderResourceRecord(githubInput, resource, "2026-09-19T20:00:00.000Z")
      .replace(/^processor_route:.*\n/m, "")
      .replace(/^evidence_status:.*\n/m, "")
      .replace(/^evidence_inspected_at:.*\n/m, "")
      .replace(/^next_action:.*$/m, `next_action: ${JSON.stringify(LEGACY_CAPTURE_NEXT_ACTION)}`)
      .replace(/^- Next action:.*$/m, `- Next action: ${LEGACY_CAPTURE_NEXT_ACTION}`);
    expect(legacy).not.toContain("processor_route");

    const updated = updateResourceRecord(legacy, githubInput, resource, "2026-09-30T12:00:00.000Z", {
      evidence: capturedEvidence({}, "2026-09-30T12:00:00.000Z"),
    });

    expect(updated).toMatch(/disposition: "PENDING"\nprocessor_route: "GitHub evidence processor \(LifeOS\)"\nevidence_status: "source-evidence-captured"\nevidence_inspected_at: "2026-09-30T12:00:00.000Z"\n/);
    expect(frontmatterValue(updated, "next_action")).toContain("GitHub evidence processor (LifeOS)");
    expect(updated).toContain("- Next action: Review the Source Evidence section written by the GitHub evidence processor (LifeOS)");
    expect(updated).toContain("- Evidence: source evidence captured at intake; see Source Evidence below.");
    expect(sectionOrder(updated)).toEqual(["Source", "Evaluation", "Source Evidence", "Capture History", "Governance"]);
    expect(updated.match(/^next_action:/gm)).toHaveLength(1);
  });

  it("never overwrites an owner-edited processor route or next action on re-capture", () => {
    const input = { source: "https://youtu.be/abc123XYZ" };
    const resource = normalizeResource(input);
    const edited = renderResourceRecord(input, resource, "2026-09-30T10:00:00.000Z")
      .replace(/^processor_route:.*$/m, 'processor_route: "owner custom route"')
      .replace(/^next_action:.*$/m, 'next_action: "Watch the video with the team on Friday."');

    const updated = updateResourceRecord(edited, input, resource, "2026-09-30T11:00:00.000Z");

    expect(updated).toContain('processor_route: "owner custom route"');
    expect(updated).toContain('next_action: "Watch the video with the team on Friday."');
    expect(updated).toContain('evidence_status: "capture-only"');
  });

  it("recognizes prompt-like captures so EXTRACT can route into Prompt Intelligence", () => {
    expect(isPromptLikeResource({ title: "YouTube Transcript Knowledge Extraction Prompt", tags: ["resource"] })).toBe(true);
    expect(isPromptLikeResource({ topic: "prompt" })).toBe(true);
    expect(isPromptLikeResource({ title: "Random article" })).toBe(false);
    expect(PROMPT_INTELLIGENCE_FOLDER).toBe("40 Resources/Prompts");
  });
});
