import { NextResponse } from "next/server";

const OWNER = "ebyron357";
const REPO = "LifeOS-Enterprise";
const BASE = "main";
const ALLOWED_STATUSES = new Set(["active", "waiting", "blocked", "complete"]);
const ALLOWED_PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);

type Change = {
  path: string;
  project: string;
  before: { status: string; priority: string; next_action: string };
  after: { status: string; priority: string; next_action: string };
};

type ChangePlan = {
  schema: "lifeos.change-plan.v1";
  write_mode: "proposal-only";
  changes: Change[];
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function validPath(value: string) {
  const normalized = value.replace(/\\/g, "/");
  return (
    (normalized.startsWith("Projects/") || normalized.startsWith("10 Projects/")) &&
    normalized.endsWith(".md") &&
    !normalized.toLowerCase().includes("template") &&
    !normalized.includes("..")
  );
}

function validatePlan(input: unknown): ChangePlan {
  if (!input || typeof input !== "object") throw new Error("Missing change plan.");
  const plan = input as Partial<ChangePlan>;
  if (plan.schema !== "lifeos.change-plan.v1" || plan.write_mode !== "proposal-only") {
    throw new Error("Unsupported change-plan schema or write mode.");
  }
  if (!Array.isArray(plan.changes) || plan.changes.length < 1 || plan.changes.length > 25) {
    throw new Error("A change plan must contain 1–25 changes.");
  }
  for (const change of plan.changes) {
    if (!validPath(change.path)) throw new Error(`Path is not allowlisted: ${change.path}`);
    if (!change.project?.trim()) throw new Error("Every change requires a project name.");
    if (!ALLOWED_STATUSES.has(change.after?.status)) throw new Error(`Invalid status for ${change.project}.`);
    if (!ALLOWED_PRIORITIES.has(change.after?.priority)) throw new Error(`Invalid priority for ${change.project}.`);
    if (change.after.status !== "complete" && change.after.next_action.trim().length < 4) {
      throw new Error(`Next action is required for ${change.project}.`);
    }
  }
  return plan as ChangePlan;
}

function replaceFrontmatter(source: string, key: string, value: string) {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) throw new Error("Project note is missing YAML frontmatter.");
  const end = normalized.indexOf("\n---", 4);
  if (end < 0) throw new Error("Project note has invalid YAML frontmatter.");
  const head = normalized.slice(4, end);
  const pattern = new RegExp(`^${key}:.*$`, "m");
  const escaped = value.replace(/"/g, '\\"');
  const line = `${key}: "${escaped}"`;
  const nextHead = pattern.test(head) ? head.replace(pattern, line) : `${head}\n${line}`;
  return `---\n${nextHead}\n---${normalized.slice(end + 4)}`;
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
  if (!response.ok) throw new Error(data.message || `GitHub request failed (${response.status}).`);
  return data;
}

export async function POST(request: Request) {
  if (process.env.LIFEOS_WRITE_ENABLED !== "true") return jsonError("Vault write service is disabled.", 503);
  const expectedSecret = process.env.LIFEOS_WRITE_SECRET;
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedSecret || !suppliedSecret || suppliedSecret !== expectedSecret) return jsonError("Unauthorized.", 401);
  const token = process.env.LIFEOS_GITHUB_TOKEN;
  if (!token) return jsonError("GitHub write credential is not configured.", 503);

  try {
    const body = await request.json();
    const plan = validatePlan(body.plan);
    const baseRef = await github(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, token);
    const branch = `lifeos/change-plan-${Date.now()}`;
    await github(`/repos/${OWNER}/${REPO}/git/refs`, token, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseRef.object.sha }),
    });

    for (const change of plan.changes) {
      const encodedPath = change.path.split("/").map(encodeURIComponent).join("/");
      const current = await github(`/repos/${OWNER}/${REPO}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`, token);
      const source = Buffer.from(current.content, "base64").toString("utf8");
      let updated = replaceFrontmatter(source, "status", change.after.status);
      updated = replaceFrontmatter(updated, "priority", change.after.priority);
      updated = replaceFrontmatter(updated, "next_action", change.after.next_action);
      await github(`/repos/${OWNER}/${REPO}/contents/${encodedPath}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: `chore(lifeos): stage approved update for ${change.project}`,
          content: Buffer.from(updated, "utf8").toString("base64"),
          sha: current.sha,
          branch,
        }),
      });
    }

    const pull = await github(`/repos/${OWNER}/${REPO}/pulls`, token, {
      method: "POST",
      body: JSON.stringify({
        title: `chore(lifeos): apply approved project change plan`,
        head: branch,
        base: BASE,
        draft: true,
        body: [
          "## LifeOS approved change plan",
          "",
          "Created through the authenticated Interactive Operations approval gate.",
          "",
          ...plan.changes.map((change) => `- **${change.project}**: status ${change.before.status} → ${change.after.status}; priority ${change.before.priority} → ${change.after.priority}`),
          "",
          "No direct commit was made to `main`. Review and merge this PR to apply the canonical vault changes.",
        ].join("\n"),
      }),
    });

    return NextResponse.json({ ok: true, branch, pullRequestUrl: pull.html_url, pullRequestNumber: pull.number });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to persist change plan.", 400);
  }
}
