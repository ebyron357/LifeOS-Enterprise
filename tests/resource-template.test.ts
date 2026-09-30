import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeResource, renderResourceRecord } from "@/lib/resource-intelligence/model";
import { RESOURCE_PROCESSOR_ROUTES } from "@/lib/resource-intelligence/routing";

const template = readFileSync(path.join(process.cwd(), "99 Templates/Resource.md"), "utf8");

function frontmatter(markdown: string): string {
  const end = markdown.indexOf("\n---", 4);
  return markdown.slice(4, end);
}

function frontmatterKeys(markdown: string): string[] {
  return [...frontmatter(markdown).matchAll(/^([a-z_]+):/gm)].map((match) => match[1]);
}

function frontmatterValue(markdown: string, key: string): string | null {
  const match = frontmatter(markdown).match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
  return match ? match[1] : null;
}

function headings(markdown: string): string[] {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
}

describe("Resource template matches the Resource Intelligence record contract", () => {
  const input = { source: "https://github.com/vercel-labs/knowledge-agent-template" };
  const record = renderResourceRecord(input, normalizeResource(input), "2026-09-30T10:00:00.000Z");

  it("carries every frontmatter key a canonical record carries, in the same order", () => {
    const recordKeys = frontmatterKeys(record);
    const templateKeys = frontmatterKeys(template);
    expect(templateKeys.filter((key) => recordKeys.includes(key))).toEqual(recordKeys);
  });

  it("defaults to capture-time truth: PENDING review, capture-only evidence, owner-review route", () => {
    expect(frontmatterValue(template, "type")).toBe("resource");
    expect(frontmatterValue(template, "status")).toBe("inbox");
    expect(frontmatterValue(template, "processing_state")).toBe('"needs-review"');
    expect(frontmatterValue(template, "architecture_classification")).toBe('"PENDING"');
    expect(frontmatterValue(template, "disposition")).toBe('"PENDING"');
    expect(frontmatterValue(template, "evidence_status")).toBe('"capture-only"');
    expect(frontmatterValue(template, "evidence_inspected_at")).toBe('""');
    expect(frontmatterValue(template, "processor_route")).toBe(JSON.stringify(RESOURCE_PROCESSOR_ROUTES["owner-review"].processorRoute));
    expect(frontmatterValue(template, "next_action")).toBe(JSON.stringify(RESOURCE_PROCESSOR_ROUTES["owner-review"].nextAction));
    expect(frontmatterValue(template, "capture_count")).toBe("1");
  });

  it("uses the record headings the intake updater relies on", () => {
    expect(headings(template)).toEqual(["Source", "Evaluation", "Source Evidence", "Capture History", "Governance"]);
    expect(template).toContain("## Capture History\n");
    for (const label of ["Architecture classification", "Disposition", "Evidence", "Next action"]) {
      expect(template).toMatch(new RegExp(`^- ${label}:`, "m"));
    }
  });

  it("keeps the fields the Recently Added Resources base displays", () => {
    for (const key of ["topic", "author", "source", "created"]) {
      expect(frontmatterKeys(template)).toContain(key);
    }
  });
});
