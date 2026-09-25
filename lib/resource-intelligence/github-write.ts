import { Buffer } from "node:buffer";

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
    console.error("lifeos_resource_cleanup_failed", {
      branch,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

export function resourceBranchName(prefix: string, slug: string) {
  const safeSlug = slug.slice(0, 42).replace(/[^a-z0-9-]/gi, "-");
  return `lifeos/${prefix}-${safeSlug}-${Date.now().toString(36)}`;
}

export function statusFromError(error: unknown) {
  const status = (error as GitHubError).status;
  return status && status >= 400 && status < 600 ? status : 502;
}
