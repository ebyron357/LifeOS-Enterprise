import type { ResourceSourceType } from "./model";

/**
 * Deterministic source-type routing for Resource Intelligence records.
 *
 * Every route points at something that already exists: the LifeOS GitHub evidence processor
 * (code), an existing vault SOP, an existing vault template, or owner review. Only the GitHub
 * route is automated; every other route is a manual, owner-run next step.
 */
export type ResourceProcessorRouteId =
  | "github-evidence-processor"
  | "youtube-knowledge-sop"
  | "technology-review-template"
  | "owner-review";

export type ResourceProcessorRoute = {
  id: ResourceProcessorRouteId;
  /** Value written to the record's `processor_route` frontmatter field. */
  processorRoute: string;
  /** Repository path of the processor, SOP, or template the route points at (null for owner review). */
  reference: string | null;
  /** True only when LifeOS runs the processor itself at capture time. */
  automated: boolean;
  /** Capture-time `next_action` for records on this route. */
  nextAction: string;
};

export const OWNER_REVIEW_SURFACE = "/resources/review";

export const RESOURCE_PROCESSOR_ROUTES: Record<ResourceProcessorRouteId, ResourceProcessorRoute> = {
  "github-evidence-processor": {
    id: "github-evidence-processor",
    processorRoute: "GitHub evidence processor (LifeOS)",
    reference: "lib/resource-intelligence/github-evidence.ts",
    automated: true,
    nextAction: `Review the Source Evidence section written by the GitHub evidence processor (LifeOS), then record architecture classification and disposition in ${OWNER_REVIEW_SURFACE}.`,
  },
  "youtube-knowledge-sop": {
    id: "youtube-knowledge-sop",
    processorRoute: "80 SOPs/Process YouTube Video into LifeOS Knowledge.md",
    reference: "80 SOPs/Process YouTube Video into LifeOS Knowledge.md",
    automated: false,
    nextAction: `Process manually with the SOP 80 SOPs/Process YouTube Video into LifeOS Knowledge.md (no automated YouTube processor), then record architecture classification and disposition in ${OWNER_REVIEW_SURFACE}.`,
  },
  "technology-review-template": {
    id: "technology-review-template",
    processorRoute: "99 Templates/Technology or Repository Review.md",
    reference: "99 Templates/Technology or Repository Review.md",
    automated: false,
    nextAction: `Evaluate manually with the template 99 Templates/Technology or Repository Review.md (no automated web, PDF, or file processor), then record architecture classification and disposition in ${OWNER_REVIEW_SURFACE}.`,
  },
  "owner-review": {
    id: "owner-review",
    processorRoute: "owner-review",
    reference: null,
    automated: false,
    nextAction: `Owner review: inspect the source manually, then record architecture classification and disposition in ${OWNER_REVIEW_SURFACE}.`,
  },
};

const ROUTE_BY_SOURCE_TYPE: Record<ResourceSourceType, ResourceProcessorRouteId> = {
  github: "github-evidence-processor",
  youtube: "youtube-knowledge-sop",
  webpage: "technology-review-template",
  "pdf-document": "technology-review-template",
  file: "technology-review-template",
  "tool-course": "owner-review",
  social: "owner-review",
  "generic-internal": "owner-review",
};

export function resourceProcessorRoute(sourceType: string): ResourceProcessorRoute {
  const id = ROUTE_BY_SOURCE_TYPE[sourceType as ResourceSourceType] ?? "owner-review";
  return RESOURCE_PROCESSOR_ROUTES[id];
}

/** Source types LifeOS processes automatically at capture time (read-only evidence only). */
export function automatedSourceTypes(): ResourceSourceType[] {
  return (Object.keys(ROUTE_BY_SOURCE_TYPE) as ResourceSourceType[])
    .filter((sourceType) => RESOURCE_PROCESSOR_ROUTES[ROUTE_BY_SOURCE_TYPE[sourceType]].automated);
}

export function sourceTypeRoutes(): Record<ResourceSourceType, { processorRoute: string; automated: boolean }> {
  return Object.fromEntries(
    (Object.keys(ROUTE_BY_SOURCE_TYPE) as ResourceSourceType[]).map((sourceType) => {
      const route = RESOURCE_PROCESSOR_ROUTES[ROUTE_BY_SOURCE_TYPE[sourceType]];
      return [sourceType, { processorRoute: route.processorRoute, automated: route.automated }];
    }),
  ) as Record<ResourceSourceType, { processorRoute: string; automated: boolean }>;
}

/** Next action written by the intake foundation before source-type routing existed. */
export const LEGACY_CAPTURE_NEXT_ACTION =
  "Review source evidence, architecture classification, disposition, overlap, value, effort, risk, and implementation need.";

const GENERATED_NEXT_ACTIONS = new Set<string>([
  LEGACY_CAPTURE_NEXT_ACTION,
  ...Object.values(RESOURCE_PROCESSOR_ROUTES).map((route) => route.nextAction),
]);

const GENERATED_PROCESSOR_ROUTES = new Set<string>(
  Object.values(RESOURCE_PROCESSOR_ROUTES).map((route) => route.processorRoute),
);

/** True when a next action was written by intake (not by an owner review or a manual edit). */
export function isGeneratedNextAction(value: string | null): boolean {
  return value === null || value.trim() === "" || GENERATED_NEXT_ACTIONS.has(value.trim());
}

/** True when a processor route was written by intake (not a manual override). */
export function isGeneratedProcessorRoute(value: string | null): boolean {
  return value === null || value.trim() === "" || GENERATED_PROCESSOR_ROUTES.has(value.trim());
}
