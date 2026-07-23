import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { getVaultIndex } from "@/lib/vault/index";
import type { AgentBrief, GrowthBrief, ProjectBrief, VaultDashboardData } from "./types";

type Frontmatter = Record<string, string>;

function normalizeNewlines(source: string) {
  return source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function parseFrontmatter(source: string): Frontmatter {
  const text = normalizeNewlines(source);
  if (!text.startsWith("---\n")) return {};
  const end = text.indexOf("\n---", 4);
  if (end === -1) return {};

  return Object.fromEntries(
    text
      .slice(4, end)
      .split("\n")
      .map((line) => line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, "").trim()]),
  );
}

function section(source: string, heading: string) {
  const text = normalizeNewlines(source);
  const match = text.match(new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?=\\n## |$)`));
  return match?.[1].trim().split("\n").find((line) => line.trim() && !line.startsWith("-"))?.trim() ?? "";
}

async function optionalMarkdown(file: string) {
  try {
    return await readFile(path.join(process.cwd(), file), "utf8");
  } catch {
    return "";
  }
}

const priorityRank: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function isDue(date: string, today: string) {
  return Boolean(date) && date <= today;
}

export async function getVaultDashboardData(now = new Date()): Promise<VaultDashboardData> {
  const today = now.toISOString().slice(0, 10);
  const [index, growthAreaSource, growthGoalSource] = await Promise.all([
    getVaultIndex(),
    optionalMarkdown("20 Areas/Personal Growth.md"),
    optionalMarkdown("30 Goals/Become My Best Self.md"),
  ]);

  const projects: ProjectBrief[] = index.notes
    .filter((note) => note.type === "project" || note.section === "projects")
    .map((note) => ({
      name: note.title,
      path: note.path,
      status: note.status ?? "unknown",
      priority: note.priority ?? "P3",
      business: note.business ?? (note.area?.replace(/\[\[|\]\]/g, "").split("/").pop()?.trim() || "LifeOS"),
      nextAction: note.nextAction ?? "Define the next action.",
      reviewDate: note.reviewDate ?? "",
      waitingOn: note.waitingOn ?? "",
      blocker: note.blocker ?? "",
    }));

  const agents: AgentBrief[] = (index.bySection.agents ?? []).map((note) => ({
    name: note.title,
    status: note.status ?? "unknown",
    reviewDate: note.reviewDate ?? "",
    purpose: section(note.body, "Purpose"),
  }));

  const growthArea = parseFrontmatter(growthAreaSource);
  const growthGoal = parseFrontmatter(growthGoalSource);
  const growth: GrowthBrief = {
    focus: section(growthAreaSource, "Current Focus") || growthArea.standard || "Choose one small, useful action.",
    currentValue: growthGoal.current_value || "0",
    targetValue: growthGoal.target_value || "24",
    reviewDate: growthGoal.review_date || "",
  };

  const active = projects.filter((project) => ["active", "waiting", "blocked"].includes(project.status));
  const priorities = [...active]
    .sort((a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) || a.reviewDate.localeCompare(b.reviewDate))
    .slice(0, 3);

  return {
    priorities,
    projects: active,
    activeProjects: active.filter((project) => project.status === "active").length,
    waitingOn: active.filter((project) => project.status === "waiting" || Boolean(project.waitingOn)).length,
    reviewsDue: active.filter((project) => isDue(project.reviewDate, today)).length,
    agents: agents.sort((a, b) => a.name.localeCompare(b.name)),
    growth,
  };
}
