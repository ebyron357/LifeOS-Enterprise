import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import {
  cleanupBranch,
  encodeRepoPath,
  github,
  readBoundedJsonObject,
  readCanonicalFile,
  resourceBranchName,
  resourceWritesConfigured,
  RESOURCE_BASE_BRANCH,
  RESOURCE_REPO_NAME,
  RESOURCE_REPO_OWNER,
  statusFromError,
} from "@/lib/resource-intelligence/github-write";
import {
  applyResourceReview,
  isResourceRecordPath,
  parseReviewDecision,
  REVIEW_ARCHITECTURES,
  REVIEW_DISPOSITIONS,
} from "@/lib/resource-intelligence/review";
import { authorizeVoiceRequest } from "@/lib/voice/security";

export const runtime = "nodejs";

const OWNER = RESOURCE_REPO_OWNER;
const REPO = RESOURCE_REPO_NAME;
const BASE = RESOURCE_BASE_BRANCH;
const MAX_BODY_BYTES = 16_000;

function jsonError(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: process.env.LIFEOS_WRITE_ENABLED === "true",
    configured: resourceWritesConfigured(),
    mode: "draft-pr-only",
    directMainWrites: false,
    architectures: REVIEW_ARCHITECTURES,
    dispositions: REVIEW_DISPOSITIONS,
    capabilities: {
      ownerReviewedDisposition: true,
      automaticDisposition: false,
      autoImplementation: false,
      revisionRequiresExplicitFlag: true,
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
  const body = read.value;

  const path = typeof body.path === "string" ? body.path.trim() : "";
  if (!isResourceRecordPath(path)) {
    return jsonError("path must be a canonical Resource Intelligence record.", 400);
  }

  const parsed = parseReviewDecision(body.decision);
  if (!parsed.ok) return jsonError(parsed.error, 400);
  const decision = parsed.decision;

  let existing;
  try {
    existing = await readCanonicalFile(path, token);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not read the canonical record.", statusFromError(error));
  }
  if (!existing) return jsonError("Canonical resource record not found on main.", 404);

  let review;
  try {
    review = applyResourceReview(existing.source, decision, new Date().toISOString());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Review could not be applied.", 409);
  }

  let ref;
  try {
    ref = await github(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, token);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not resolve main branch.", statusFromError(error));
  }
  const object = ref.object as { sha?: string } | undefined;
  if (!object?.sha) return jsonError("Could not resolve main branch.", 502);

  const slug = path.split("/").pop()!.replace(/\.md$/, "");
  const branch = resourceBranchName("resource-review", slug);
  const title = path.split("/").pop()!;

  try {
    await github(`/repos/${OWNER}/${REPO}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: object.sha }),
    });

    await github(`/repos/${OWNER}/${REPO}/contents/${encodeRepoPath(path)}`, token, {
      method: "PUT",
      body: JSON.stringify({
        message: `docs(resource): review ${slug} as ${decision.disposition}`,
        content: Buffer.from(review.markdown).toString("base64"),
        branch,
        sha: existing.sha,
      }),
    });

    const pull = await github(`/repos/${OWNER}/${REPO}/pulls`, token, {
      method: "POST",
      body: JSON.stringify({
        title: `resource review: ${decision.disposition} ${title}`,
        head: branch,
        base: BASE,
        draft: true,
        body: [
          "## LifeOS Resource Intelligence review",
          "",
          `- Canonical record: \`${path}\``,
          `- Previous disposition: \`${review.previousDisposition}\``,
          `- Architecture classification: \`${decision.architectureClassification}\``,
          `- Disposition: \`${decision.disposition}\``,
          `- Rationale: ${decision.rationale}`,
          "",
          "This decision was entered by the owner. LifeOS did not choose the disposition and does not implement it.",
          "Merging this draft PR records the decision; it never writes directly to main.",
        ].join("\n"),
      }),
    });

    return NextResponse.json({
      ok: true,
      path,
      previousDisposition: review.previousDisposition,
      decision: {
        architectureClassification: decision.architectureClassification,
        disposition: decision.disposition,
      },
      pullRequest: {
        number: pull.number ?? null,
        url: pull.html_url ?? null,
        draft: true,
      },
    });
  } catch (error) {
    await cleanupBranch(branch, token);
    return jsonError(error instanceof Error ? error.message : "Resource review draft PR failed.", statusFromError(error));
  }
}
