import { describe, expect, it } from "vitest";
import {
  normalizeResource,
  renderResourceRecord,
  resourceRecordPath,
  updateResourceRecord,
} from "@/lib/resource-intelligence/model";

describe("Resource Intelligence canonical identity", () => {
  it("dedupes GitHub repository URL variants to one identity", () => {
    const first = normalizeResource({ source: "https://github.com/Vercel-Labs/knowledge-agent-template.git?utm_source=test" });
    const second = normalizeResource({ source: "github.com/vercel-labs/knowledge-agent-template/issues/12" });

    expect(first.sourceType).toBe("github");
    expect(first.sourceIdentity).toBe("github:vercel-labs/knowledge-agent-template");
    expect(second.sourceIdentity).toBe(first.sourceIdentity);
    expect(second.canonicalSource).toBe("https://github.com/vercel-labs/knowledge-agent-template");
    expect(resourceRecordPath(second)).toBe(resourceRecordPath(first));
  });

  it("dedupes YouTube URL forms by video ID", () => {
    const short = normalizeResource({ source: "https://youtu.be/abc123XYZ?si=tracking" });
    const watch = normalizeResource({ source: "https://www.youtube.com/watch?v=abc123XYZ&utm_source=test" });

    expect(short.sourceType).toBe("youtube");
    expect(short.sourceIdentity).toBe("youtube:abc123XYZ");
    expect(watch.sourceIdentity).toBe(short.sourceIdentity);
    expect(watch.canonicalSource).toBe("https://www.youtube.com/watch?v=abc123XYZ");
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
});
