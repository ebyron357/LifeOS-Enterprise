import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeResource, renderResourceRecord } from "@/lib/resource-intelligence/model";
import {
  automatedSourceTypes,
  RESOURCE_PROCESSOR_ROUTES,
  resourceProcessorRoute,
  sourceTypeRoutes,
} from "@/lib/resource-intelligence/routing";

const YOUTUBE_SOP = "80 SOPs/Process YouTube Video into LifeOS Knowledge.md";
const REVIEW_TEMPLATE = "99 Templates/Technology or Repository Review.md";

describe("Resource Intelligence source-type routing", () => {
  it.each([
    ["github", "GitHub evidence processor (LifeOS)", true],
    ["youtube", YOUTUBE_SOP, false],
    ["webpage", REVIEW_TEMPLATE, false],
    ["pdf-document", REVIEW_TEMPLATE, false],
    ["file", REVIEW_TEMPLATE, false],
    ["tool-course", "owner-review", false],
    ["social", "owner-review", false],
    ["generic-internal", "owner-review", false],
    ["something-new", "owner-review", false],
  ])("routes %s to %s", (sourceType, processorRoute, automated) => {
    const route = resourceProcessorRoute(sourceType);
    expect(route.processorRoute).toBe(processorRoute);
    expect(route.automated).toBe(automated);
    expect(route.nextAction).toContain("/resources/review");
  });

  it("points every route at a processor, SOP, or template that exists in the repository", () => {
    for (const route of Object.values(RESOURCE_PROCESSOR_ROUTES)) {
      if (route.reference === null) {
        expect(route.id).toBe("owner-review");
        continue;
      }
      expect(existsSync(path.join(process.cwd(), route.reference)), route.reference).toBe(true);
      if (!route.automated) expect(route.nextAction).toContain(route.reference);
    }
  });

  it("reports only GitHub as an automated processor", () => {
    expect(automatedSourceTypes()).toEqual(["github"]);
    const routes = sourceTypeRoutes();
    expect(Object.entries(routes).filter(([, route]) => route.automated).map(([sourceType]) => sourceType)).toEqual(["github"]);
  });

  it.each([
    ["https://github.com/vercel-labs/knowledge-agent-template", "GitHub evidence processor (LifeOS)"],
    ["https://youtu.be/abc123XYZ", YOUTUBE_SOP],
    ["https://example.com/article", REVIEW_TEMPLATE],
    ["https://example.com/paper.pdf", REVIEW_TEMPLATE],
    ["https://www.coursera.org/learn/machine-learning", "owner-review"],
    ["https://x.com/someone/status/1", "owner-review"],
    ["an internal idea about weekly planning", "owner-review"],
  ])("writes processor_route and next_action for %s", (source, processorRoute) => {
    const resource = normalizeResource({ source });
    const record = renderResourceRecord({ source }, resource, "2026-09-30T10:00:00.000Z");
    const route = resourceProcessorRoute(resource.sourceType);

    expect(record).toContain(`processor_route: ${JSON.stringify(processorRoute)}`);
    expect(record).toContain(`next_action: ${JSON.stringify(route.nextAction)}`);
    expect(record).toContain(`- Next action: ${route.nextAction}`);
  });

  it("routes file-hash captures to the technology review template", () => {
    const input = { source: "", fileName: "Report.pdf", fileHash: "a".repeat(64) };
    const record = renderResourceRecord(input, normalizeResource(input), "2026-09-30T10:00:00.000Z");
    expect(record).toContain(`processor_route: ${JSON.stringify(REVIEW_TEMPLATE)}`);
  });
});
