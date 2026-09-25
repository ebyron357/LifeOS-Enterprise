import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";

/** Canonical vault repository for governed draft-PR writes. Writes never target main directly. */
export const RESOURCE_REPO_OWNER = "ebyron357";
export const RESOURCE_REPO_NAME = "LifeOS-Enterprise";
export const RESOURCE_BASE_BRANCH = "main";

export type GitHubError = Error & { status?: number };

export function resourceWritesConfigured() {
  return Boolean(
    process.env.LIFEOS_WRITE_ENABLED === "true"
      && process.env.LIFEOS_WRITE_SECRET
      && process.env.LIFEOS_GITHUB_TOKEN,
  );
}

export async function github(path: string, token: string, init?: RequestInit) {
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

export function encodeRepoPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function readCanonicalFile(path: string, token: string): Promise<{ sha: string; source: string } | null> {
  try {
    const data = await github(
      `/repos/${RESOURCE_REPO_OWNER}/${RESOURCE_REPO_NAME}/contents/${encodeRepoPath(path)}?ref=${RESOURCE_BASE_BRANCH}`,
      token,
    );
    const content = typeof data.content === "string" ? data.content : "";
    const sha = typeof data.sha === "string" ? data.sha : "";
    if (!content || !sha) throw new Error("Canonical resource response is incomplete.");
    return { sha, source: Buffer.from(content, "base64").toString("utf8") };
  } catch (error) {
    if ((error as GitHubError).status === 404) return null;
    throw error;
  }
}

export async function cleanupBranch(branch: string, token: string) {
  try {
    await github(
      `/repos/${RESOURCE_REPO_OWNER}/${RESOURCE_REPO_NAME}/git/refs/heads/${encodeURIComponent(branch)}`,
      token,
      { method: "DELETE" },
    );
  } catch (error) {
    console.error("lifeos_draft_pr_cleanup_failed", {
      branch,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

export function resourceBranchName(prefix: string, slug: string) {
  const safeSlug = slug.slice(0, 42).replace(/[^a-z0-9-]/gi, "-");
  const unique = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
  return `lifeos/${prefix}-${safeSlug}-${unique}`;
}

export type BoundedJsonResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; status: number; error: string };

/**
 * Reads the body as text and enforces the byte limit on what was actually received,
 * so a missing, chunked, or understated Content-Length cannot bypass it.
 */
export async function readBoundedJsonObject(request: Request, maxBytes: number): Promise<BoundedJsonResult> {
  const declared = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large." };
  }
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    const reader = request.body?.getReader();
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 413, error: "Request body is too large." };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "Could not read request body." };
  }
  const text = Buffer.concat(chunks).toString("utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, status: 400, error: "Request body must be a JSON object." };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

export function statusFromError(error: unknown) {
  const status = (error as GitHubError).status;
  return status && status >= 400 && status < 600 ? status : 502;
}
