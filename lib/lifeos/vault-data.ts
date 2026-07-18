import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { AgentBrief, GrowthBrief, ProjectBrief, VaultDashboardData } from "./types";

type Frontmatter = Record<string, string>;

function parseFrontmatter(source: string): Frontmatter {
  if (!source.startsWith("---\n")) return {};
  const end = source.indexOf("\n---", 4);
  if (end === -1) return {};

  return Object.fromEntries(
    source
      .slice(4, end)
      .split("\n")
      .map((line) => line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1], match[2].replace(/^['"]|['"]$/g, "").trim()]),
  );
}

function section(source: string, heading: string) {
  const match = source.match(new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?=\\n## |$)`));
  return match?.[1].trim().split("\n").find((line) => line.trim() && !line.startsWith("-"))?.trim() ?? "";
}

async function markdownFiles(directory: string) {
  const absolute = path.join(process.cwd(), directory);
  const files = (await readdir(absolute)).filter((file) => file.endsWith(".md") && file !== "README.md");
  return Promise.all(files.map(async (file) => ({
    name: file.replace(/\.md$/, ""),
    source: await readFile(path.join(absolute, file), "utf8"),
  })));
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
  const [projectFiles, agentFiles, growthAreaSource, growthGoalSource] = await Promise.all([
    markdownFiles("Projects"),
    markdownFiles("AI"),
    optionalMarkdown("20 Areas/Personal Growth.md"),
    optionalMarkdown("30 Goals/Become My Best Self.md"),
  ]);

  const projects: ProjectBrief[] = projectFiles.map(({ name, source }) => {
    const meta = parseFrontmatter(source);
    return {
      name,
      status: meta.status ?? "unknown",
      priority: meta.priority ?? "P3",
      business: meta.business ?? "LifeOS",
      nextAction: meta.next_action ?? "Define the next action.",
      reviewDate: meta.review_date ?? "",
      waitingOn: meta.waiting_on ?? "",
      blocker: meta.blocker ?? "",
    };
  });

  const agents: AgentBrief[] = agentFiles.map(({ name, source }) => {
    const meta = parseFrontmatter(source);
    return {
      name,
      status: meta.status ?? "unknown",
      reviewDate: meta.review_date ?? "",
      purpose: section(source, "Purpose"),
    };
  });

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
