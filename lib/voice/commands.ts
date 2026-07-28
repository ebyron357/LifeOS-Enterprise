import type { AgentBrief, ProjectBrief } from "@/lib/lifeos/types";
import { buildMorningBriefSpeech } from "@/lib/lifeos/morning-brief-speech";
import { noteHref } from "@/lib/vault/slug";

export type VoiceCommandContext = {
  projects: ProjectBrief[];
  agents: AgentBrief[];
  activeProjects: number;
  waitingOn: number;
  reviewsDue: number;
  locale?: string;
};

export type ParsedVoiceCommand =
  | { kind: "read"; tool: string; args?: Record<string, unknown>; utterance: string }
  | { kind: "write"; tool: string; args: Record<string, unknown>; utterance: string; summary: string }
  | { kind: "control"; action: "stop" | "repeat" | "speak_slower" | "audio_off" | "clear"; utterance: string }
  | { kind: "unknown"; utterance: string };

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/[?.!,]/g, " ").replace(/\s+/g, " ");
}

function findProject(projects: ProjectBrief[], fragment: string) {
  const needle = fragment.trim().toLowerCase();
  if (!needle) return undefined;
  return projects.find((project) => project.name.toLowerCase() === needle)
    ?? projects.find((project) => project.name.toLowerCase().includes(needle));
}

/**
 * Deterministic command parser for V1. Does not invent project data.
 * Locale is accepted for future ht/fr packs; English phrases are primary in V1.
 */
export function parseVoiceCommand(raw: string, context: VoiceCommandContext): ParsedVoiceCommand {
  const utterance = raw.trim();
  const text = normalize(utterance);
  if (!text) return { kind: "unknown", utterance };

  if (/^(stop|cancel|quiet|be quiet)$/.test(text) || text === "stop speaking") {
    return { kind: "control", action: "stop", utterance };
  }
  if (/^(repeat that|say that again|replay)$/.test(text)) {
    return { kind: "control", action: "repeat", utterance };
  }
  if (/speak slower|slower please|slow down/.test(text)) {
    return { kind: "control", action: "speak_slower", utterance };
  }
  if (/turn off audio|mute audio|disable audio|audio off/.test(text)) {
    return { kind: "control", action: "audio_off", utterance };
  }
  if (/clear transcript|clear the transcript/.test(text)) {
    return { kind: "control", action: "clear", utterance };
  }

  if (/morning brief|read my brief|hear my brief|read the brief/.test(text)) {
    return { kind: "read", tool: "read_morning_brief", utterance };
  }
  if (/what needs (my )?attention|what deserves attention|what should i focus/.test(text)) {
    return { kind: "read", tool: "what_needs_attention", utterance };
  }
  if (/show blocked|what is blocked|what'?s blocked|blocked projects/.test(text)) {
    return { kind: "read", tool: "list_blocked_projects", utterance };
  }
  if (/waiting on|what am i waiting|show waiting/.test(text)) {
    return { kind: "read", tool: "list_waiting_projects", utterance };
  }
  if (/which projects are overdue|overdue projects|reviews due/.test(text)) {
    return { kind: "read", tool: "list_overdue_projects", utterance };
  }
  if (/which agents are active|active agents|show agents/.test(text)) {
    return { kind: "read", tool: "list_active_agents", utterance };
  }
  if (/show the command map|open command map|command map/.test(text)) {
    return { kind: "read", tool: "show_command_map", utterance };
  }
  if (/show the command board|open command board|command board/.test(text)) {
    return { kind: "read", tool: "show_command_board", utterance };
  }
  if (/what changed recently|recent changes/.test(text)) {
    return { kind: "read", tool: "what_changed_recently", utterance };
  }

  const openMatch = text.match(/^(?:open|go to)\s+(.+)$/);
  if (openMatch) {
    const project = findProject(context.projects, openMatch[1]);
    if (project) {
      return { kind: "read", tool: "open_project", args: { project: project.name, path: project.path }, utterance };
    }
  }

  const explainMatch = text.match(/^(?:explain(?: this)? project|explain)\s+(.+)$/);
  if (explainMatch) {
    const project = findProject(context.projects, explainMatch[1].replace(/^project\s+/, ""));
    if (project) {
      return { kind: "read", tool: "explain_project", args: { project: project.name, simple: false }, utterance };
    }
  }
  if (/explain that more simply|simpler explanation|explain simply/.test(text)) {
    return { kind: "read", tool: "explain_last_simply", utterance };
  }
  if (/read only the next action|next action only|what is the next action/.test(text)) {
    return { kind: "read", tool: "read_next_action", utterance };
  }

  const statusMatch = text.match(/^(?:set|mark|change)\s+(.+?)\s+(?:to|as)\s+(active|waiting|blocked|complete)$/);
  if (statusMatch) {
    const project = findProject(context.projects, statusMatch[1]);
    if (project) {
      return {
        kind: "write",
        tool: "stage_project_status",
        args: { project: project.name, path: project.path, status: statusMatch[2], from: project.status },
        utterance,
        summary: `Stage ${project.name} status ${project.status || "unknown"} → ${statusMatch[2]}`,
      };
    }
  }

  const priorityMatch = text.match(/^(?:set|change)\s+(.+?)\s+priority\s+(?:to\s+)?(p[0-3])$/);
  if (priorityMatch) {
    const project = findProject(context.projects, priorityMatch[1]);
    if (project) {
      const priority = priorityMatch[2].toUpperCase();
      return {
        kind: "write",
        tool: "stage_project_priority",
        args: { project: project.name, path: project.path, priority, from: project.priority },
        utterance,
        summary: `Stage ${project.name} priority ${project.priority} → ${priority}`,
      };
    }
  }

  return { kind: "unknown", utterance };
}

export function buildReadToolSpeech(tool: string, context: VoiceCommandContext, args: Record<string, unknown> = {}) {
  const { projects, agents, activeProjects, reviewsDue } = context;
  switch (tool) {
    case "read_morning_brief":
      return buildMorningBriefSpeech({ activeProjects, projects, reviewsDue });
    case "what_needs_attention": {
      const top = projects
        .filter((project) => project.status === "active" || project.status === "blocked" || project.blocker)
        .slice(0, 3)
        .map((project) => `${project.name}: ${project.nextAction}`)
        .join(". ");
      return top
        ? `Attention now: ${top}. Reviews due: ${reviewsDue}.`
        : `No active attention items are recorded. Reviews due: ${reviewsDue}.`;
    }
    case "list_blocked_projects": {
      const blocked = projects.filter((project) => project.status === "blocked" || project.blocker);
      if (!blocked.length) return "There are no blocked projects in the live vault data.";
      return `Blocked projects: ${blocked.map((project) => `${project.name}. Blocker: ${project.blocker || "recorded as blocked"}`).join(" ")}`;
    }
    case "list_waiting_projects": {
      const waiting = projects.filter((project) => project.status === "waiting" || project.waitingOn);
      if (!waiting.length) return "Nothing is marked waiting in the live vault data.";
      return `Waiting: ${waiting.map((project) => `${project.name}. Waiting on: ${project.waitingOn || "unspecified"}`).join(" ")}`;
    }
    case "list_overdue_projects": {
      const today = new Date().toISOString().slice(0, 10);
      const overdue = projects.filter((project) => project.reviewDate && project.reviewDate <= today);
      if (!overdue.length) return "No projects have a review date due on or before today.";
      return `Reviews due: ${overdue.map((project) => `${project.name}, review ${project.reviewDate}`).join("; ")}.`;
    }
    case "list_active_agents": {
      const active = agents.filter((agent) => agent.status === "active");
      if (!active.length) return "No agents are marked active.";
      return `Active agents: ${active.map((agent) => agent.name).join(", ")}.`;
    }
    case "show_command_map":
      return "Opening the command map view.";
    case "show_command_board":
      return "Opening the command board view.";
    case "what_changed_recently":
      return "Recent vault changes are not summarized by voice yet. Use GitHub pull requests and project review dates for verified change history.";
    case "open_project": {
      const name = String(args.project || "");
      const project = findProject(projects, name);
      if (!project) return "That project was not found in live vault data.";
      return `Opening ${project.name}. Next action: ${project.nextAction}`;
    }
    case "explain_project":
    case "explain_last_simply": {
      const name = String(args.project || context.projects[0]?.name || "");
      const project = findProject(projects, name);
      if (!project) return "I do not have a verified project to explain.";
      if (args.simple || tool === "explain_last_simply") {
        return `${project.name} is ${project.status}. Next step: ${project.nextAction}`;
      }
      return [
        `${project.name}.`,
        `Status: ${project.status}.`,
        `Priority: ${project.priority}.`,
        `Business: ${project.business}.`,
        `Next action: ${project.nextAction}.`,
        project.blocker ? `Blocker: ${project.blocker}.` : "",
        project.waitingOn ? `Waiting on: ${project.waitingOn}.` : "",
      ].filter(Boolean).join(" ");
    }
    case "read_next_action": {
      const project = context.projects[0];
      if (!project) return "No live project next action is available.";
      return `${project.name}: ${project.nextAction}`;
    }
    default:
      return "I understood a read request, but that tool is not registered.";
  }
}

export function navigationForTool(tool: string, args: Record<string, unknown> = {}) {
  if (tool === "show_command_map") return "map";
  if (tool === "show_command_board") return "board";
  if (tool === "open_project" && typeof args.path === "string") return noteHref(args.path);
  return undefined;
}
