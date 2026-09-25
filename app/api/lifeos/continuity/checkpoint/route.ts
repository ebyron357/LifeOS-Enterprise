import { Buffer } from "node:buffer";
import { NextResponse } from "next/server";
import { validOrigin, withinAgentRateLimit } from "@/lib/agent/http";
import {
  buildCheckpoint,
  isCheckpointRecordPath,
  parseCheckpointOverrides,
  renderCheckpointRecord,
  resumePackageToCheckpoint,
} from "@/lib/continuity/checkpoint";
import { getContinuityResumePackage } from "@/lib/continuity/sources";
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
} from "@/lib/github/draft-pr";
import { authorizeVoiceRequest } from "@/lib/voice/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    folder: "Command Center/Checkpoints",
    capabilities: {
      snapshotFromDerivedResume: true,
      ownerOverrides: true,
      overwriteExisting: false,
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

  const parsed = parseCheckpointOverrides(read.value.checkpoint);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  const capturedAt = new Date().toISOString();
  const resume = await getContinuityResumePackage();
  const checkpoint = buildCheckpoint(resumePackageToCheckpoint(resume, capturedAt), parsed.overrides);
  if (!checkpoint.nextAction) return jsonError("A checkpoint needs a next action.", 400);
  if (!isCheckpointRecordPath(checkpoint.path)) return jsonError("Could not derive a canonical checkpoint path.", 500);

  let existing;
  try {
    existing = await readCanonicalFile(checkpoint.path, token);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not check the checkpoint path.", statusFromError(error));
  }
  if (existing) return jsonError("A checkpoint already exists at this path; checkpoints are never overwritten.", 409);

  let ref;
  try {
    ref = await github(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, token);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not resolve main branch.", statusFromError(error));
  }
  const object = ref.object as { sha?: string } | undefined;
  if (!object?.sha) return jsonError("Could not resolve main branch.", 502);

  const slug = checkpoint.path.split("/").pop()!.replace(/\.md$/, "");
  const branch = resourceBranchName("checkpoint", slug);

  try {
    await github(`/repos/${OWNER}/${REPO}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: object.sha }),
    });

    await github(`/repos/${OWNER}/${REPO}/contents/${encodeRepoPath(checkpoint.path)}`, token, {
      method: "PUT",
      body: JSON.stringify({
        message: `docs(continuity): checkpoint ${checkpoint.project || "LifeOS"}`,
        content: Buffer.from(renderCheckpointRecord(checkpoint)).toString("base64"),
        branch,
      }),
    });

    const pull = await github(`/repos/${OWNER}/${REPO}/pulls`, token, {
      method: "POST",
      body: JSON.stringify({
        title: `checkpoint: ${checkpoint.title}`,
        head: branch,
        base: BASE,
        draft: true,
        body: [
          "## LifeOS Continuity checkpoint",
          "",
          `- Record: \`${checkpoint.path}\``,
          `- Project: ${checkpoint.project || "LifeOS"}`,
          `- Next action: ${checkpoint.nextAction}`,
          `- Session status: \`${checkpoint.sessionStatus}\``,
          "",
          "Snapshot of the derived resume package plus any supplied fields. Merging records it; this never writes directly to main.",
        ].join("\n"),
      }),
    });

    return NextResponse.json({
      ok: true,
      path: checkpoint.path,
      checkpoint: {
        title: checkpoint.title,
        project: checkpoint.project,
        nextAction: checkpoint.nextAction,
        sessionStatus: checkpoint.sessionStatus,
      },
      pullRequest: { number: pull.number ?? null, url: pull.html_url ?? null, draft: true },
    });
  } catch (error) {
    await cleanupBranch(branch, token);
    return jsonError(error instanceof Error ? error.message : "Checkpoint draft PR failed.", statusFromError(error));
  }
}
