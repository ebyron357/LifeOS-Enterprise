import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import {
  normalizeResource,
  renderResourceRecord,
  resourceRecordPath,
  updateResourceRecord,
  type ResourceCaptureInput,
} from "@/lib/resource-intelligence/model";
import { authorizeVoiceRequest } from "@/lib/voice/security";

export const runtime = "nodejs";

const OWNER = "ebyron357";
const REPO = "LifeOS-Enterprise";
const BASE = "main";
const MAX_BODY_BYTES = 64_000;

type GitHubError = Error & { status?: number };

function configured() {
  return Boolean(
    process.env.LIFEOS_WRITE_ENABLED === "true"
      && process.env.LIFEOS_WRITE_SECRET
      && process.env.LIFEOS_GITHUB_TOKEN,
  );
}

function jsonError(error: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, error, details }, { status });
}

async function github(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error((data as { message?: string }).message || `GitHub request failed (${response.status}).`) as GitHubError;
    error.status = response.status;
    throw error;
  }
  return data as Record<string, unknown>;
}

async function existingRecord(path: string, token: string): Promise<{ sha: string; source: string } | null> {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  try {
    const data = await github(`/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${BASE}`, token);
    const content = typeof data.content === "string" ? data.content : "";
    const sha = typeof data.sha === "string" ? data.sha : "";
    if (!content || !sha) throw new Error("Canonical resource response is incomplete.");
    return { sha, source: Buffer.from(content, "base64").toString("utf8") };
  } catch (error) {
    if ((error as GitHubError).status === 404) return null;
    throw error;
  }
}

async function cleanupBranch(branch: string, token: string) {
  try {
    await github(`/repos/${OWNER}/${REPO}/git/refs/heads/${encodeURIComponent(branch)}`, token, { method: "DELETE" });
  } catch (error) {
    console.error("lifeos_resource_cleanup_failed", {
      branch,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

function branchName(slug: string) {
  const safeSlug = slug.slice(0, 42).replace(/[^a-z0-9-]/gi, "-");
  return `lifeos/resource-${safeSlug}-${Date.now().toString(36)}`;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: process.env.LIFEOS_WRITE_ENABLED === "true",
    configured: configured(),
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
  const existing = await existingRecord(path, token);
  const markdown = existing
    ? updateResourceRecord(existing.source, input, resource, nowIso)
    : renderResourceRecord(input, resource, nowIso);

  const ref = await github(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, token);
  const object = ref.object as { sha?: string } | undefined;
  if (!object?.sha) return jsonError("Could not resolve main branch.", 502);

  const branch = branchName(resource.slug);

  try {
    await github(`/repos/${OWNER}/${REPO}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: object.sha }),
    });

    const encoded = path.split("/").map(encodeURIComponent).join("/");
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
    const status = (error as GitHubError).status;
    return jsonError(
      error instanceof Error ? error.message : "Resource draft PR failed.",
      status && status >= 400 && status < 600 ? status : 502,
    );
  }
}
