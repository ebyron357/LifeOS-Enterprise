import type { ProjectBrief } from "./types";

export type MorningBriefSpeechInput = {
  activeProjects: number;
  projects: ProjectBrief[];
  reviewsDue: number;
};

/**
 * Builds the spoken morning briefing from verified dashboard counts.
 * `activeProjects` must be the same count used by the dashboard mission strip
 * (status === "active" only — not blocked or waiting).
 */
export function buildMorningBriefSpeech({
  activeProjects,
  projects,
  reviewsDue,
}: MorningBriefSpeechInput): string {
  const blocked = projects.filter((project) => project.status === "blocked" || project.blocker).length;
  const waiting = projects.filter((project) => project.status === "waiting" || project.waitingOn).length;
  const top = projects
    .filter((project) => project.status === "active")
    .slice(0, 3)
    .map((project) => `${project.name}. Next: ${project.nextAction}`)
    .join(" ");

  return `Good day, Bwa. You have ${activeProjects} active projects, ${blocked} blocked, ${waiting} waiting, and ${reviewsDue} reviews due. Your top work is: ${top || "No active priorities are recorded."}`;
}
