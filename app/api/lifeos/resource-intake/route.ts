import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import {
  cleanupBranch,
  encodeRepoPath,
  findOpenPullRequestForBranch,
  github,
  readBoundedJsonObject,
  readCanonicalFile,
  resetBranchToCommit,
  resourceIntakeBranchName,
  resourceWritesConfigured,
  RESOURCE_BASE_BRANCH,
  RESOURCE_REPO_NAME,
  RESOURCE_REPO_OWNER,
  statusFromError,
  type GitHubError,
  type OpenPullRequest,
} from "@/lib/github/draft-pr";
import { collectGitHubSourceEvidence } from "@/lib/resource-intelligence/github-evidence";
import {
  normalizeResource,
  renderResourceRecord,
  resourceRecordPath,
  updateResourceRecord,
  type NormalizedResource,
  type ResourceCaptureInput,
} from "@/lib/resource-intelligence/model";
import {
  automatedSourceTypes,
  resourceProcessorRoute,
  sourceTypeRoutes,
  type ResourceProcessorRoute,
} from "@/lib/resource-intelligence/routing";
import type { ResourceSourceEvidence } from "@/lib/resource-intelligence/source-evidence";
import { authorizeVoiceRequest } from "@/lib/voice/security";

export const runtime = "nodejs";

const OWNER = RESOURCE_REPO_OWNER;
const REPO = RESOURCE_REPO_NAME;
const BASE = RESOURCE_BASE_BRANCH;
const MAX_BODY_BYTES = 64_000;

type CanonicalFile = { sha: string; source: string };

type IntakeContext = {
  token: string;
  input: ResourceCaptureInput;
  resource: NormalizedResource;
  path: string;
  branch: string;
  route: ResourceProcessorRoute;
  evidence: ResourceSourceEvidence | null;
  nowIso: string;
  onMain: CanonicalFile | null;
};

function jsonError(error: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
}

function upstreamStatus(error: unknown): number | null {
  const status = (error as GitHubError)?.status;
  return typeof status === "number" ? status : null;
}

/** GitHub failures before any write: a clean 502 with a fixed message; upstream text is never echoed. */
function upstreamReadError(error: unknown) {
  console.error("lifeos_resource_intake_github_read_failed", { upstreamStatus: upstreamStatus(error) });
  return jsonError(
    "Could not read the canonical resource state from GitHub. Nothing was written.",
    502,
    { upstreamStatus: upstreamStatus(error) },
  );
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Only known capture fields are accepted. Anything else in the body, including client-supplied
 * evidence, is ignored: source evidence is gathered server-side at write time.
 */
function captureInputFrom(body: Record<string, unknown>): ResourceCaptureInput {
  return {
    source: stringField(body.source) ?? "",
    title: stringField(body.title),
    captureChannel: stringField(body.captureChannel),
    relatedProject: stringField(body.relatedProject),
    relatedArea: stringField(body.relatedArea),
    owner: stringField(body.owner),
    reviewDate: stringField(body.reviewDate),
    fileName: stringField(body.fileName),
    fileHash: stringField(body.fileHash),
    fileSize: typeof body.fileSize === "number" ? body.fileSize : undefined,
    fileType: stringField(body.fileType),
  };
}

function composeRecord(context: IntakeContext, current: CanonicalFile | null): string {
  const options = { evidence: context.evidence };
  return current
    ? updateResourceRecord(current.source, context.input, context.resource, context.nowIso, options)
    : renderResourceRecord(context.input, context.resource, context.nowIso, options);
}

async function putRecord(context: IntakeContext, markdown: string, sha: string | undefined, update: boolean) {
  if (context.branch === BASE) throw new Error("Refusing to write the base branch.");
  const body: Record<string, unknown> = {
    message: update
      ? `docs(resource): update ${context.resource.title} capture`
      : `docs(resource): capture ${context.resource.title}`,
    content: Buffer.from(markdown).toString("base64"),
    branch: context.branch,
  };
  if (sha) body.sha = sha;
  await github(`/repos/${OWNER}/${REPO}/contents/${encodeRepoPath(context.path)}`, context.token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

function success(
  context: IntakeContext,
  outcome: {
    duplicate: boolean;
    dedupe: "new-identity" | "exact-identity" | "open-draft-pr";
    pull: { number: number | null; url: string | null; draft: boolean };
    reused: boolean;
  },
) {
  return NextResponse.json({
    ok: true,
    duplicate: outcome.duplicate,
    dedupe: outcome.dedupe,
    duplicateOf: outcome.reused
      ? {
          reason: "An open intake pull request already stages this record path; it was updated instead of opening a competing PR.",
          pullRequest: { number: outcome.pull.number, url: outcome.pull.url },
          branch: context.branch,
          path: context.path,
        }
      : null,
    resource: {
      title: context.resource.title,
      sourceType: context.resource.sourceType,
      sourceIdentity: context.resource.sourceIdentity,
      canonicalSource: context.resource.canonicalSource,
      path: context.path,
    },
    routing: {
      processorRoute: context.route.processorRoute,
      automated: context.route.automated,
      nextAction: context.route.nextAction,
    },
    evidence: context.evidence
      ? {
          status: context.evidence.status,
          inspectedAt: context.evidence.inspectedAt,
          error: context.evidence.status === "evidence-unavailable" ? context.evidence.error : undefined,
        }
      : { status: "capture-only", inspectedAt: null },
    pullRequest: {
      number: outcome.pull.number,
      url: outcome.pull.url,
      draft: outcome.pull.draft,
      reused: outcome.reused,
    },
    boundaries: {
      architectureClassification: "PENDING",
      disposition: "PENDING",
      semanticDedupe: false,
      sourceProcessing: false,
      assetGeneration: false,
    },
  });
}

/** Updates the record on the branch of an open intake PR for the same path. Never opens another PR. */
async function stageOnOpenPull(context: IntakeContext, pull: OpenPullRequest) {
  let onBranch: CanonicalFile | null;
  try {
    onBranch = await readCanonicalFile(context.path, context.token, pull.headRef);
  } catch (error) {
    return upstreamReadError(error);
  }

  let markdown: string;
  try {
    markdown = composeRecord(context, onBranch ?? context.onMain);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Resource record could not be updated.", 409);
  }

  try {
    await putRecord(context, markdown, onBranch?.sha, Boolean(onBranch ?? context.onMain));
  } catch (error) {
    // The branch backs an open PR, so it is never deleted here.
    return jsonError("Could not update the open resource draft PR.", statusFromError(error), {
      upstreamStatus: upstreamStatus(error),
    });
  }

  return success(context, { duplicate: true, dedupe: "open-draft-pr", pull, reused: true });
}

/** Deletes a branch this request prepared, unless an open PR now uses it (or that cannot be confirmed). */
async function cleanupPreparedBranch(context: IntakeContext) {
  try {
    if (await findOpenPullRequestForBranch(context.branch, context.token)) return;
  } catch {
    return;
  }
  await cleanupBranch(context.branch, context.token);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: process.env.LIFEOS_WRITE_ENABLED === "true",
    configured: resourceWritesConfigured(),
    mode: "draft-pr-only",
    directMainWrites: false,
    capabilities: {
      exactIdentityDedupe: true,
      openDraftPrDedupe: true,
      canonicalResourceRecord: true,
      semanticDedupe: false,
      sourceProcessors: {
        automated: automatedSourceTypes(),
        scope: "read-only source evidence at write time; every other source type is routed to a manual SOP, template, or owner review",
        routes: sourceTypeRoutes(),
      },
      assetFactory: false,
      automaticDisposition: false,
    },
  });
}

export async function POST(request: Request) {
  if (!validOrigin(request)) return jsonError("Origin not allowed.", 403);
  if (!withinAgentRateLimit(request, 12)) return jsonError("Rate limit exceeded.", 429);

  const auth = authorizeVoiceRequest(request, { requireWriteSecret: true });
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const token = process.env.LIFEOS_GITHUB_TOKEN;
  if (!token) return jsonError("GitHub write token is not configured.", 503);

  const read = await readBoundedJsonObject(request, MAX_BODY_BYTES);
  if (!read.ok) return jsonError(read.error, read.status);
  const input = captureInputFrom(read.value);

  let resource: NormalizedResource;
  try {
    resource = normalizeResource(input);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid resource.", 400);
  }

  const route = resourceProcessorRoute(resource.sourceType);
  // Provenance is re-established server-side at write time; it never comes from the client.
  const evidence = resource.sourceType === "github"
    ? await collectGitHubSourceEvidence(resource.canonicalSource, { token })
    : null;

  const path = resourceRecordPath(resource);
  const branch = resourceIntakeBranchName(resource.slug);
  const nowIso = new Date().toISOString();

  let onMain: CanonicalFile | null;
  let openPull: OpenPullRequest | null;
  let baseSha: string | null = null;
  try {
    onMain = await readCanonicalFile(path, token);
    openPull = await findOpenPullRequestForBranch(branch, token);
    if (!openPull) {
      const ref = await github(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, token);
      baseSha = (ref.object as { sha?: string } | undefined)?.sha ?? null;
    }
  } catch (error) {
    return upstreamReadError(error);
  }

  const context: IntakeContext = { token, input, resource, path, branch, route, evidence, nowIso, onMain };

  if (openPull) return stageOnOpenPull(context, openPull);
  if (!baseSha) return jsonError("Could not resolve main branch.", 502);

  let markdown: string;
  try {
    markdown = composeRecord(context, onMain);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Resource record could not be updated.", 409);
  }

  let branchPrepared = false;
  try {
    try {
      await github(`/repos/${OWNER}/${REPO}/git/refs`, token, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
      });
    } catch (error) {
      if (upstreamStatus(error) !== 422) throw error;
      // The deterministic branch already exists. Reuse a PR opened concurrently; otherwise the
      // branch is left over from a merged or closed intake PR and is moved to the current main.
      const concurrent = await findOpenPullRequestForBranch(branch, token);
      if (concurrent) return stageOnOpenPull(context, concurrent);
      await resetBranchToCommit(branch, baseSha, token);
    }
    branchPrepared = true;

    await putRecord(context, markdown, onMain?.sha, Boolean(onMain));

    let pull: Record<string, unknown>;
    try {
      pull = await github(`/repos/${OWNER}/${REPO}/pulls`, token, {
        method: "POST",
        body: JSON.stringify({
          title: onMain
            ? `resource: refresh ${resource.title}`
            : `resource: capture ${resource.title}`,
          head: branch,
          base: BASE,
          draft: true,
          body: [
            "## LifeOS Resource Intelligence capture",
            "",
            `- Stable identity: \`${resource.sourceIdentity}\``,
            `- Source type: \`${resource.sourceType}\``,
            `- Canonical record: \`${path}\``,
            `- Exact duplicate: \`${onMain ? "yes" : "no"}\``,
            `- Processor route: ${route.processorRoute}${route.automated ? " (automated, read-only)" : " (manual)"}`,
            `- Source evidence: \`${evidence?.status ?? "capture-only"}\``,
            "",
            "Architecture classification and disposition remain PENDING until source-grounded review.",
            "Source evidence is provenance, not a disposition.",
            "Repeated captures of this record update this PR until it merges.",
            "This PR does not bypass owner review and never writes directly to main.",
          ].join("\n"),
        }),
      });
    } catch (error) {
      if (upstreamStatus(error) === 422) {
        const concurrent = await findOpenPullRequestForBranch(branch, token);
        if (concurrent) {
          return success(context, { duplicate: true, dedupe: "open-draft-pr", pull: concurrent, reused: true });
        }
      }
      throw error;
    }

    return success(context, {
      duplicate: Boolean(onMain),
      dedupe: onMain ? "exact-identity" : "new-identity",
      pull: {
        number: typeof pull.number === "number" ? pull.number : null,
        url: typeof pull.html_url === "string" ? pull.html_url : null,
        draft: true,
      },
      reused: false,
    });
  } catch (error) {
    if (branchPrepared) await cleanupPreparedBranch(context);
    return jsonError("Resource draft PR failed. Nothing was written to main.", statusFromError(error), {
      upstreamStatus: upstreamStatus(error),
    });
  }
}
