import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { getVaultIndex } from "@/lib/vault/index";
import type { AgentBrief, AreaBrief, BusinessBrief, GrowthBrief, PersonBrief, ProjectBrief, VaultDashboardData } from "./types";

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

function firstSentence(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

/**
 * The shared vault parser keeps inline `[a, b]` lists only, so YAML block lists
 * (`tags:` followed by `- item` lines) arrive empty. Read them from the raw note.
 */
function blockListTags(source: string): string[] {
  const text = normalizeNewlines(source);
  if (!text.startsWith("---\n")) return [];
  const end = text.indexOf("\n---", 4);
  if (end === -1) return [];
  const lines = text.slice(4, end).split("\n");
  const start = lines.findIndex((line) => /^tags:\s*$/.test(line));
  if (start === -1) return [];
  const tags: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^\s*-\s+(.+)$/);
    if (!match) break;
    tags.push(match[1].trim().replace(/^['"]|['"]$/g, ""));
  }
  return tags;
}

function normalizeTags(tags: string[]): string[] {
  return tags.map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean);
}

function isTemplateOrPlaceholder(note: { title: string; path: string; section?: string | null }) {
  const normalizedPath = note.path.toLowerCase();
  return note.section === "templates"
    || normalizedPath.includes("/templates/")
    || normalizedPath.startsWith("templates/")
    || normalizedPath.startsWith("99 templates/")
    || /\{\{[^}]+\}\}/.test(note.title);
}

const priorityRank: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function isDue(date: string, today: string) {
  return Boolean(date) && date <= today;
}

function isLiveProject(note: { title: string; path: string; type?: string | null; section?: string | null }) {
  const normalizedPath = note.path.toLowerCase();
  const isProject = note.type === "project" || note.section === "projects";
  const isTemplate = note.section === "templates" || normalizedPath.includes("/templates/") || normalizedPath.startsWith("templates/") || normalizedPath.startsWith("99 templates/");
  const hasPlaceholderTitle = /\{\{[^}]+\}\}/.test(note.title);

  return isProject && !isTemplate && !hasPlaceholderTitle;
}

export async function getVaultDashboardData(now = new Date()): Promise<VaultDashboardData> {
  const today = now.toISOString().slice(0, 10);
  const [index, growthAreaSource, growthGoalSource] = await Promise.all([
    getVaultIndex(),
    optionalMarkdown("20 Areas/Personal Growth.md"),
    optionalMarkdown("30 Goals/Become My Best Self.md"),
  ]);

  const projects: ProjectBrief[] = index.notes
    .filter(isLiveProject)
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
      owner: note.owner ?? "",
    }));

  const agents: AgentBrief[] = (index.bySection.agents ?? []).map((note) => ({
    name: note.title,
    status: note.status ?? "unknown",
    reviewDate: note.reviewDate ?? "",
    purpose: section(note.body, "Purpose"),
  }));

  const businesses: BusinessBrief[] = (index.bySection.businesses ?? [])
    .filter((note) => {
      const path = note.path.toLowerCase();
      const isTemplate = note.section === "templates" || path.includes("/templates/") || path.startsWith("templates/") || path.startsWith("99 templates/");
      return (note.type === "business" || note.section === "businesses") && !isTemplate && !/\{\{[^}]+\}\}/.test(note.title);
    })
    .map((note) => {
      const kpiFocus = typeof note.frontmatter.kpi_focus === "string" ? note.frontmatter.kpi_focus.trim() : "";
      return {
        name: note.title,
        path: note.path,
        status: note.status ?? "unknown",
        ...(kpiFocus ? { kpiFocus } : {}),
      };
    });

  const people: PersonBrief[] = (index.bySection.people ?? [])
    .filter((note) => {
      const path = note.path.toLowerCase();
      const isTemplate = note.section === "templates" || path.includes("/templates/") || path.startsWith("templates/") || path.startsWith("99 templates/");
      const isIndex = note.title.trim().toLowerCase() === "people" || path.endsWith("/people.md") || path.endsWith("\\people.md");
      return (note.type === "person" || note.section === "people") && !isTemplate && !isIndex && !/\{\{[^}]+\}\}/.test(note.title);
    })
    .map((note) => ({
      name: note.title,
      path: note.path,
      organization: note.organization ?? "",
      role: note.role ?? "",
    }));

  // The index already drops excluded paths and private frontmatter, so only public area notes appear here.
  const areaNotes = index.notes
    .filter((note) => note.type === "area" && (note.status ?? "").toLowerCase() === "active" && !isTemplateOrPlaceholder(note));
  const areas: AreaBrief[] = await Promise.all(areaNotes.map(async (note) => ({
    name: note.title,
    path: note.path,
    status: note.status ?? "active",
    tags: normalizeTags(note.tags.length ? note.tags : blockListTags(await optionalMarkdown(note.path))),
    standard: typeof note.frontmatter.standard === "string" ? note.frontmatter.standard.trim() : "",
    purpose: firstSentence(section(note.body, "Purpose")),
    reviewDate: note.reviewDate ?? "",
  })));

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
    businesses: businesses.sort((a, b) => a.name.localeCompare(b.name)),
    people: people.sort((a, b) => a.name.localeCompare(b.name)),
    areas: areas.sort((a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path)),
    growth,
  };
}
