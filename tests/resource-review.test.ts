import { describe, expect, it } from "vitest";
import { normalizeResource, renderResourceRecord, updateResourceRecord } from "@/lib/resource-intelligence/model";
import {
  applyResourceReview,
  catalogResourceRecords,
  groupResourcesByLane,
  isResourceRecordPath,
  parseReviewDecision,
  resourceDuplicateCandidates,
  resourceLane,
  type ResourceRecordView,
  type ResourceReviewDecision,
} from "@/lib/resource-intelligence/review";
import type { VaultNote } from "@/lib/vault/types";

const NOW = "2026-09-25T12:00:00.000Z";
const input = { source: "https://github.com/vercel-labs/knowledge-agent-template", title: "Knowledge Agent Template" };
const resource = normalizeResource(input);
const record = renderResourceRecord(input, resource, "2026-09-20T10:00:00.000Z");

function decision(overrides: Partial<ResourceReviewDecision> = {}): ResourceReviewDecision {
  return {
    architectureClassification: "TEMPLATE",
    disposition: "ADAPT",
    rationale: "README describes a reusable template; overlaps LifeOS vault indexing.",
    ...overrides,
  };
}

function note(path: string, frontmatter: Record<string, unknown>, title = "Resource"): VaultNote {
  return {
    path,
    slug: path,
    title,
    type: (frontmatter.type as string) ?? null,
    status: null,
    priority: null,
    tags: [],
    owner: null,
    reviewDate: (frontmatter.review_date as string) ?? null,
    nextAction: null,
    blocker: null,
    waitingOn: null,
    business: null,
    area: null,
    goal: null,
    organization: null,
    role: null,
    relationship: null,
    lastContact: null,
    nextContact: null,
    created: null,
    updated: null,
    folder: path.split("/").slice(0, -1).join("/"),
    section: "resources",
    legacy: false,
    excerpt: "",
    headings: [],
    links: [],
    embeds: [],
    tasks: [],
    body: "",
    frontmatter,
    modifiedAt: null,
  };
}

describe("Resource review decisions", () => {
  it("requires a real disposition and a rationale", () => {
    expect(parseReviewDecision({ disposition: "PENDING", rationale: "long enough rationale" }).ok).toBe(false);
    expect(parseReviewDecision({ disposition: "WATCH", rationale: "short", nextReviewDate: "2026-10-01" }).ok).toBe(false);
    expect(parseReviewDecision(null).ok).toBe(false);
  });

  it("refuses ADOPT/ADAPT without an architecture classification", () => {
    const result = parseReviewDecision({ disposition: "ADOPT", architectureClassification: "PENDING", rationale: "Evidence supports adoption." });
    expect(result).toMatchObject({ ok: false });
  });

  it("requires a next review date for WATCH and validates date shape", () => {
    expect(parseReviewDecision({ disposition: "WATCH", rationale: "Promising but immature." }).ok).toBe(false);
    expect(parseReviewDecision({ disposition: "WATCH", rationale: "Promising but immature.", nextReviewDate: "soon" }).ok).toBe(false);
    expect(parseReviewDecision({ disposition: "WATCH", rationale: "Promising but immature.", nextReviewDate: "2026-12-01" }).ok).toBe(true);
  });

  it("normalizes case, collapses multi-line input, and drops unknown ratings", () => {
    const result = parseReviewDecision({
      disposition: "extract",
      architectureClassification: "project",
      rationale: "Line one\nline two: extract the prompt.",
      value: "HIGH",
      risk: "extreme",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.disposition).toBe("EXTRACT");
    expect(result.decision.architectureClassification).toBe("PROJECT");
    expect(result.decision.rationale).not.toContain("\n");
    expect(result.decision.value).toBe("high");
    expect(result.decision.risk).toBeUndefined();
  });

  it("applies an owner decision to frontmatter, evaluation, and review history", () => {
    const { markdown, previousDisposition } = applyResourceReview(
      record,
      decision({ value: "high", effort: "medium", license: "MIT", overlap: "vault indexing", reviewer: "owner" }),
      NOW,
    );
    expect(previousDisposition).toBe("PENDING");
    expect(markdown).toContain('disposition: "ADAPT"');
    expect(markdown).toContain('architecture_classification: "TEMPLATE"');
    expect(markdown).toContain('processing_state: "implementation"');
    expect(markdown).toContain('status: "active"');
    expect(markdown).toContain('value_rating: "high"');
    expect(markdown).toContain('license_review: "MIT"');
    expect(markdown).toContain(`reviewed_at: "${NOW}"`);
    expect(markdown).toContain("- Architecture classification: **TEMPLATE**");
    expect(markdown).toContain("- Disposition: **ADAPT**");
    expect(markdown).toContain("## Review History");
    expect(markdown.indexOf("## Review History")).toBeLessThan(markdown.indexOf("## Governance"));
    expect(markdown).toMatch(/reviewed as TEMPLATE \/ ADAPT by owner/);
    // identity and capture history are untouched
    expect(markdown).toContain(`source_identity: "${resource.sourceIdentity}"`);
    expect(markdown).toContain("## Capture History");
    // frontmatter remains a single well-formed block
    expect(markdown.startsWith("---\n")).toBe(true);
    expect(markdown.split("\n---\n").length).toBeGreaterThanOrEqual(2);
  });

  it("refuses to silently overwrite a reviewed decision and records explicit revisions", () => {
    const first = applyResourceReview(record, decision(), NOW).markdown;
    expect(() => applyResourceReview(first, decision({ disposition: "REJECT", architectureClassification: "PENDING" }), NOW)).toThrow(/already reviewed/);
    const revised = applyResourceReview(
      first,
      decision({ disposition: "REJECT", architectureClassification: "PENDING", revise: true }),
      "2026-09-26T09:00:00.000Z",
    );
    expect(revised.previousDisposition).toBe("ADAPT");
    expect(revised.markdown).toContain('disposition: "REJECT"');
    expect(revised.markdown).toContain('processing_state: "rejected"');
    expect(revised.markdown).toMatch(/revised from ADAPT/);
    expect(revised.markdown.match(/^- 2026-09-2\d.*(reviewed|revised)/gm)?.length).toBe(2);
  });

  it("keeps the review when the same resource is captured again", () => {
    const reviewed = applyResourceReview(record, decision(), NOW).markdown;
    const recaptured = updateResourceRecord(reviewed, input, resource, "2026-09-27T09:00:00.000Z");
    expect(recaptured).toContain('disposition: "ADAPT"');
    expect(recaptured).toContain("capture_count: 2");
    expect(recaptured).toContain("## Review History");
  });

  it("rejects non-resource targets", () => {
    expect(() => applyResourceReview("---\ntype: project\n---\n# Project\n", decision(), NOW)).toThrow(/not a canonical Resource/);
  });

  it("only accepts canonical record paths", () => {
    expect(isResourceRecordPath(`40 Resources/Resource Intelligence/Records/${resource.slug}.md`)).toBe(true);
    expect(isResourceRecordPath("40 Resources/Resource Intelligence/Records/../../README.md")).toBe(false);
    expect(isResourceRecordPath("10 Projects/secret.md")).toBe(false);
    expect(isResourceRecordPath("40 Resources/Resource Intelligence/Records/UPPER.md")).toBe(false);
  });
});

describe("Resource review lanes", () => {
  it("maps disposition and processing state to lanes", () => {
    expect(resourceLane("PENDING", "needs-review")).toBe("review");
    expect(resourceLane("PENDING", "processing")).toBe("processing");
    expect(resourceLane("ADOPT", "implementation")).toBe("implementation");
    expect(resourceLane("EXTRACT", "completed")).toBe("completed");
    expect(resourceLane("WATCH", "watch")).toBe("watch");
    expect(resourceLane("REJECT", "rejected")).toBe("archived");
    expect(resourceLane("ARCHIVE", "archived")).toBe("archived");
  });

  it("catalogs only canonical resource records and flags due reviews", () => {
    const base = "40 Resources/Resource Intelligence/Records";
    const notes = [
      note(`${base}/a.md`, { type: "resource", source_identity: "github:a/a", disposition: "PENDING", review_date: "2026-09-20", capture_count: 3 }, "A"),
      note(`${base}/b.md`, { type: "resource", source_identity: "url:b", disposition: "WATCH", processing_state: "watch", review_date: "2026-12-01" }, "B"),
      note(`${base}/c.md`, { type: "resource", source_identity: "url:c", disposition: "ADOPT", architecture_classification: "PLATFORM" }, "C"),
      note(`${base}/README.md`, { type: "readme" }, "Readme"),
      note("40 Resources/Technology/tool.md", { type: "resource" }, "Legacy resource"),
    ];
    const records = catalogResourceRecords(notes, "2026-09-25");
    expect(records.map((r) => r.title)).toEqual(["A", "B", "C"]);
    expect(records[0]).toMatchObject({ reviewDue: true, captureCount: 3, lane: "review" });
    expect(records.find((r) => r.title === "B")).toMatchObject({ reviewDue: false, lane: "watch" });
    const lanes = groupResourcesByLane(records);
    expect(lanes.review).toHaveLength(1);
    expect(lanes.implementation).toHaveLength(1);
    expect(lanes.watch).toHaveLength(1);
    expect(lanes.archived).toHaveLength(0);
  });
});

describe("Resource duplicate candidates", () => {
  function view(title: string, sourceIdentity: string): ResourceRecordView {
    return {
      path: `40 Resources/Resource Intelligence/Records/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
      title,
      sourceType: sourceIdentity.startsWith("github:") ? "github" : "webpage",
      sourceIdentity,
      canonicalSource: "",
      processingState: "needs-review",
      architecture: "PENDING",
      disposition: "PENDING",
      captureCount: 1,
      lastCaptured: null,
      reviewDate: null,
      reviewDue: false,
      lane: "review",
    };
  }

  it("suggests likely forks and near-identical titles without merging", () => {
    const records = [
      view("Knowledge Agent Template", "github:vercel-labs/knowledge-agent-template"),
      view("Knowledge agent template fork", "github:someone/knowledge-agent-template"),
      view("Obsidian Dataview guide", "url:https://example.com/dataview"),
      view("The Obsidian Dataview Guide", "url:https://blog.example.org/dataview-guide"),
      view("Unrelated cooking video", "youtube:abc123"),
    ];
    const candidates = resourceDuplicateCandidates(records);
    expect(candidates).toHaveLength(2);
    expect(candidates[0].reason).toMatch(/possible fork/);
    expect(candidates.some((c) => c.reason.includes("share"))).toBe(true);
    expect(candidates.every((c) => c.left.sourceIdentity !== c.right.sourceIdentity)).toBe(true);
    expect(records).toHaveLength(5);
  });

  it("ignores exact-identity matches and weak title overlap", () => {
    const records = [
      view("Next.js deployment checklist", "url:https://a.example/x"),
      view("Next.js deployment checklist", "url:https://a.example/x"),
      view("Deployment of cooking recipes", "url:https://b.example/y"),
    ];
    expect(resourceDuplicateCandidates(records)).toEqual([]);
  });
});
