import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { AgentBrief, ProjectBrief, VaultDashboardData } from "./types";

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

const priorityRank: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function isDue(date: string, today: string) {
  return Boolean(date) && date <= today;
}

export async function getVaultDashboardData(now = new Date()): Promise<VaultDashboardData> {
  const today = now.toISOString().slice(0, 10);
  const [projectFiles, agentFiles] = await Promise.all([markdownFiles("Projects"), markdownFiles("AI")]);

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

  const active = projects.filter((project) => ["active", "waiting", "blocked"].includes(project.status));
  const priorities = [...active]
    .sort((a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) || a.reviewDate.localeCompare(b.reviewDate))
    .slice(0, 3);

  return {
    priorities,
    activeProjects: active.filter((project) => project.status === "active").length,
    waitingOn: active.filter((project) => project.status === "waiting" || Boolean(project.waitingOn)).length,
    reviewsDue: active.filter((project) => isDue(project.reviewDate, today)).length,
    agents: agents.sort((a, b) => a.name.localeCompare(b.name)),
  };
}
