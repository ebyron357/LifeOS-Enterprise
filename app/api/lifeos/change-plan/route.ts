import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

const OWNER = "ebyron357";
const REPO = "LifeOS-Enterprise";
const BASE = "main";
const MAX_BODY_BYTES = 64_000;
const ALLOWED_STATUSES = new Set(["active", "waiting", "blocked", "complete"]);
const ALLOWED_PRIORITIES = new Set(["P0", "P1", "P2", "P3"]);
const ALLOWED_FIELDS = new Set(["status", "priority", "next_action"]);
const requestWindows = new Map<string, number[]>();

type FieldName = "status" | "priority" | "next_action";
type FieldChange = { field: FieldName; from: string; to: string };
type Change = { path: string; project: string; fields: FieldChange[] };
type ChangePlan = {
  schema: "lifeos.change-plan.v1";
  write_mode: "proposal-only";
  generated_at?: string;
  changes: Change[];
};
type GithubError = Error & { status?: number };

type CanonicalNote = {
  sha: string;
  source: string;
  frontmatter: Record<string, string>;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

function configured() {
  return Boolean(
    process.env.LIFEOS_WRITE_ENABLED === "true" &&
    process.env.LIFEOS_WRITE_SECRET &&
    process.env.LIFEOS_GITHUB_TOKEN,
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: process.env.LIFEOS_WRITE_ENABLED === "true",
    configured: configured(),
    mode: "draft-pr-only",
    directMainWrites: false,
  });
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function rateLimited(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (requestWindows.get(key) ?? []).filter((value) => now - value < 10 * 60_000);
  recent.push(now);
  requestWindows.set(key, recent);
  return recent.length > 5;
}

function validOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = process.env.LIFEOS_ALLOWED_ORIGIN;
  if (allowed) return origin === allowed;
  return origin === new URL(request.url).origin;
}

function normalizedPath(value: string) {
  return value.replace(/\\/g, "/");
}

function validPath(value: string) {
  const normalized = normalizedPath(value);
  const lower = normalized.toLowerCase();
  return (
    (normalized.startsWith("Projects/") || normalized.startsWith("10 Projects/")) &&
    normalized.endsWith(".md") &&
    !lower.includes("template") &&
    !lower.includes("archive") &&
    !lower.includes("private") &&
    !normalized.includes("..") &&
    !normalized.startsWith("/")
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
  const paths = new Set<string>();
  for (const change of plan.changes) {
    if (!validPath(change.path)) throw new Error(`Path is not allowlisted: ${change.path}`);
    if (paths.has(change.path)) throw new Error(`Duplicate project path: ${change.path}`);
    paths.add(change.path);
    if (!change.project?.trim()) throw new Error("Every change requires a project name.");
    if (!Array.isArray(change.fields) || change.fields.length < 1 || change.fields.length > 3) {
      throw new Error(`Invalid field changes for ${change.project}.`);
    }
    const seen = new Set<string>();
    for (const field of change.fields) {
      if (!ALLOWED_FIELDS.has(field.field) || seen.has(field.field)) {
        throw new Error(`Invalid or duplicate field for ${change.project}.`);
      }
      if (typeof field.from !== "string" || typeof field.to !== "string" || field.to.length > 2_000) {
        throw new Error(`Invalid field values for ${change.project}.`);
      }
      seen.add(field.field);
    }
  }
  return plan as ChangePlan;
}

function planId(plan: ChangePlan) {
  const canonical = JSON.stringify({
    schema: plan.schema,
    write_mode: plan.write_mode,
    changes: [...plan.changes]
      .map((change) => ({ ...change, fields: [...change.fields].sort((a, b) => a.field.localeCompare(b.field)) }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
}

function parseFrontmatter(source: string) {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) throw new Error("Project note is missing YAML frontmatter.");
  const end = normalized.indexOf("\n---", 4);
  if (end < 0) throw new Error("Project note has invalid YAML frontmatter.");
  const values: Record<string, string> = {};
  for (const line of normalized.slice(4, end).split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return values;
}

function replaceFrontmatter(source: string, key: string, value: string) {
  const normalized = source.replace(/\r\n/g, "\n");
  const end = normalized.indexOf("\n---", 4);
  const head = normalized.slice(4, end);
  const pattern = new RegExp(`^${key}:.*$`, "m");
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ");
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
  if (!response.ok) {
    const error = new Error(data.message || `GitHub request failed (${response.status}).`) as GithubError;
    error.status = response.status;
    throw error;
  }
  return data;
}

async function canonicalNote(path: string, token: string): Promise<CanonicalNote> {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const current = await github(`/repos/${OWNER}/${REPO}/contents/${encoded}?ref=${BASE}`, token);
  const source = Buffer.from(current.content, "base64").toString("utf8");
  const frontmatter = parseFrontmatter(source);
  const privacy = `${frontmatter.private ?? ""} ${frontmatter.web_visibility ?? ""} ${frontmatter.publish ?? ""}`.toLowerCase();
  if (privacy.includes("true") || privacy.includes("private") || frontmatter.publish?.toLowerCase() === "false") {
    throw new Error(`Project is not eligible for web changes: ${path}`);
  }
  return { sha: current.sha, source, frontmatter };
}

function validateCanonical(change: Change, note: CanonicalNote) {
  const conflicts = change.fields.flatMap((field) => {
    const current = note.frontmatter[field.field] ?? "";
    return current === field.from ? [] : [{ field: field.field, expected: field.from, current }];
  });
  if (conflicts.length) return { project: change.project, path: change.path, conflicts };
  const resulting = { ...note.frontmatter };
  for (const field of change.fields) resulting[field.field] = field.to;
  if (!ALLOWED_STATUSES.has(resulting.status ?? "active")) throw new Error(`Invalid resulting status for ${change.project}.`);
  if (!ALLOWED_PRIORITIES.has(resulting.priority ?? "P3")) throw new Error(`Invalid resulting priority for ${change.project}.`);
  if ((resulting.status ?? "active") !== "complete" && (resulting.next_action ?? "").trim().length < 8) {
    throw new Error(`Next action must contain at least 8 characters for ${change.project}.`);
  }
  return null;
}

async function existingPull(branch: string, token: string) {
  const pulls = await github(`/repos/${OWNER}/${REPO}/pulls?state=all&head=${OWNER}:${encodeURIComponent(branch)}`, token);
  return Array.isArray(pulls) ? pulls[0] : undefined;
}

async function deleteBranch(branch: string, token: string) {
  try {
    await github(`/repos/${OWNER}/${REPO}/git/refs/heads/${encodeURIComponent(branch)}`, token, { method: "DELETE" });
  } catch (error) {
    console.error("lifeos_change_plan_cleanup_failed", { branch, message: error instanceof Error ? error.message : "unknown" });
  }
}

export async function POST(request: Request) {
  if (process.env.LIFEOS_WRITE_ENABLED !== "true") return jsonError("Vault write service is disabled.", 503);
  if (!validOrigin(request)) return jsonError("Origin is not allowed.", 403);
  if (rateLimited(request)) return jsonError("Too many change-plan requests. Try again later.", 429);
  const size = Number(request.headers.get("content-length") || "0");
  if (size > MAX_BODY_BYTES) return jsonError("Change plan is too large.", 413);

  const expectedSecret = process.env.LIFEOS_WRITE_SECRET;
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expectedSecret || !suppliedSecret || !safeEqual(suppliedSecret, expectedSecret)) return jsonError("Unauthorized.", 401);
  const token = process.env.LIFEOS_GITHUB_TOKEN;
  if (!token) return jsonError("GitHub write credential is not configured.", 503);

  let branch = "";
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return jsonError("Change plan is too large.", 413);
    const body = JSON.parse(raw) as { plan?: unknown };
    const plan = validatePlan(body.plan);
    const id = planId(plan);
    branch = `lifeos/change-plan-${id}`;

    const previous = await existingPull(branch, token);
    if (previous) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        planId: id,
        branch,
        pullRequestUrl: previous.html_url,
        pullRequestNumber: previous.number,
        state: previous.state,
      });
    }

    const notes = new Map<string, CanonicalNote>();
    const conflictReports = [];
    for (const change of plan.changes) {
      const note = await canonicalNote(change.path, token);
      notes.set(change.path, note);
      const conflict = validateCanonical(change, note);
      if (conflict) conflictReports.push(conflict);
    }
    if (conflictReports.length) return jsonError("Canonical project data changed. Refresh and review conflicts.", 409, conflictReports);

    const baseRef = await github(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE}`, token);
    try {
      await github(`/repos/${OWNER}/${REPO}/git/refs`, token, {
        method: "POST",
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseRef.object.sha }),
      });
    } catch (error) {
      if ((error as GithubError).status !== 422) throw error;
      const duplicate = await existingPull(branch, token);
      if (duplicate) {
        return NextResponse.json({ ok: true, duplicate: true, planId: id, branch, pullRequestUrl: duplicate.html_url, pullRequestNumber: duplicate.number });
      }
      throw new Error("An incomplete branch already exists for this plan. Remove it before retrying.");
    }

    const auditChanges: unknown[] = [];
    for (const change of plan.changes) {
      const note = notes.get(change.path)!;
      const encoded = change.path.split("/").map(encodeURIComponent).join("/");
      let updated = note.source;
      for (const field of change.fields) updated = replaceFrontmatter(updated, field.field, field.to);
      await github(`/repos/${OWNER}/${REPO}/contents/${encoded}`, token, {
        method: "PUT",
        body: JSON.stringify({
          message: `chore(lifeos): stage approved update for ${change.project}`,
          content: Buffer.from(updated, "utf8").toString("base64"),
          sha: note.sha,
          branch,
        }),
      });
      auditChanges.push({ project: change.project, path: change.path, fields: change.fields, validation: "passed" });
    }

    const requester = createHash("sha256")
      .update(`${request.headers.get("x-forwarded-for") ?? "unknown"}|${request.headers.get("user-agent") ?? "unknown"}`)
      .digest("hex")
      .slice(0, 16);
    const auditPath = `90 System/Audit/change-plans/${id}.json`;
    const audit = {
      schema: "lifeos.change-plan.audit.v1",
      plan_id: id,
      created_at: new Date().toISOString(),
      requester_hash: requester,
      base_sha: baseRef.object.sha,
      branch,
      outcome: "draft_pr_requested",
      changes: auditChanges,
    };
    await github(`/repos/${OWNER}/${REPO}/contents/${auditPath.split("/").map(encodeURIComponent).join("/")}`, token, {
      method: "PUT",
      body: JSON.stringify({
        message: `chore(lifeos): record change-plan audit ${id}`,
        content: Buffer.from(JSON.stringify(audit, null, 2), "utf8").toString("base64"),
        branch,
      }),
    });

    const pull = await github(`/repos/${OWNER}/${REPO}/pulls`, token, {
      method: "POST",
      body: JSON.stringify({
        title: `chore(lifeos): apply approved project change plan ${id}`,
        head: branch,
        base: BASE,
        draft: true,
        body: [
          "## LifeOS approved change plan",
          "",
          `Plan ID: \`${id}\``,
          `Base commit: \`${baseRef.object.sha}\``,
          "",
          ...plan.changes.map((change) => `- **${change.project}**: ${change.fields.map((field) => `${field.field} ${field.from || "empty"} → ${field.to || "empty"}`).join("; ")}`),
          "",
          "No direct commit was made to `main`. Review and merge this draft PR to apply canonical vault changes.",
          "Rollback: close this PR and delete its branch. If merged, revert the merge commit through a new PR.",
        ].join("\n"),
      }),
    });

    console.info("lifeos_change_plan_created", { planId: id, branch, pullRequestNumber: pull.number, changeCount: plan.changes.length });
    return NextResponse.json({ ok: true, planId: id, branch, pullRequestUrl: pull.html_url, pullRequestNumber: pull.number, state: "submitted" });
  } catch (error) {
    if (branch) await deleteBranch(branch, token);
    console.error("lifeos_change_plan_failed", { branch: branch || null, message: error instanceof Error ? error.message : "unknown" });
    const status = (error as GithubError).status === 404 ? 409 : 400;
    return jsonError(error instanceof Error ? error.message : "Unable to persist change plan.", status);
  }
}
