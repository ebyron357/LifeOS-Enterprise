import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import {
  cleanupBranch,
  encodeRepoPath,
  github,
  readCanonicalFile,
  resourceBranchName,
  resourceWritesConfigured,
  RESOURCE_BASE_BRANCH,
  RESOURCE_REPO_NAME,
  RESOURCE_REPO_OWNER,
  statusFromError,
} from "@/lib/resource-intelligence/github-write";
import {
  normalizeResource,
  renderResourceRecord,
  resourceRecordPath,
  updateResourceRecord,
  type ResourceCaptureInput,
} from "@/lib/resource-intelligence/model";
import { authorizeVoiceRequest } from "@/lib/voice/security";

export const runtime = "nodejs";

const OWNER = RESOURCE_REPO_OWNER;
const REPO = RESOURCE_REPO_NAME;
const BASE = RESOURCE_BASE_BRANCH;
const MAX_BODY_BYTES = 64_000;

function jsonError(error: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
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
      canonicalResourceRecord: true,
      semanticDedupe: false,
      sourceProcessors: false,
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

  const size = Number(request.headers.get("content-length") || "0");
  if (size > MAX_BODY_BYTES) return jsonError("Resource capture is too large.", 413);

  const token = process.env.LIFEOS_GITHUB_TOKEN;
  if (!token) return jsonError("GitHub write token is not configured.", 503);

  let input: ResourceCaptureInput;
  try {
    input = await request.json() as ResourceCaptureInput;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  let resource;
  try {
    resource = normalizeResource(input);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid resource.", 400);
  }

  const path = resourceRecordPath(resource);
  const nowIso = new Date().toISOString();
  const existing = await readCanonicalFile(path, token);
  const markdown = existing
    ? updateResourceRecord(existing.source, input, resource, nowIso)
    : renderResourceRecord(input, resource, nowIso);

  const ref = await github(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, token);
  const object = ref.object as { sha?: string } | undefined;
  if (!object?.sha) return jsonError("Could not resolve main branch.", 502);

  const branch = resourceBranchName("resource", resource.slug);

  try {
    await github(`/repos/${OWNER}/${REPO}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: object.sha }),
    });

    const encoded = encodeRepoPath(path);
    const body: Record<string, unknown> = {
      message: existing ? `docs(resource): update ${resource.title} capture` : `docs(resource): capture ${resource.title}`,
      content: Buffer.from(markdown).toString("base64"),
      branch,
    };
    if (existing) body.sha = existing.sha;

    await github(`/repos/${OWNER}/${REPO}/contents/${encoded}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const pull = await github(`/repos/${OWNER}/${REPO}/pulls`, token, {
      method: "POST",
      body: JSON.stringify({
        title: existing
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
          `- Exact duplicate: \`${existing ? "yes" : "no"}\``,
          "",
          "Architecture classification and disposition remain PENDING until source-grounded review.",
          "This PR does not bypass owner review and never writes directly to main.",
        ].join("\n"),
      }),
    });

    return NextResponse.json({
      ok: true,
      duplicate: Boolean(existing),
      dedupe: existing ? "exact-identity" : "new-identity",
      resource: {
        title: resource.title,
        sourceType: resource.sourceType,
        sourceIdentity: resource.sourceIdentity,
        canonicalSource: resource.canonicalSource,
        path,
      },
      pullRequest: {
        number: pull.number ?? null,
        url: pull.html_url ?? null,
        draft: true,
      },
      boundaries: {
        architectureClassification: "PENDING",
        disposition: "PENDING",
        semanticDedupe: false,
        sourceProcessing: false,
        assetGeneration: false,
      },
    });
  } catch (error) {
    await cleanupBranch(branch, token);
    return jsonError(
      error instanceof Error ? error.message : "Resource draft PR failed.",
      statusFromError(error),
    );
  }
}
