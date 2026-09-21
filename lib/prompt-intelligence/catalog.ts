import type { VaultNote } from "@/lib/vault/types";
import {
  isOperationalPromptNote,
  parsePromptFromFields,
  type PromptRecord,
} from "./model";

export type PromptRecommendContext = {
  project?: string;
  client?: string;
  business?: string;
  task?: string;
  query?: string;
  agent?: string;
};

export type PromptMatchable = {
  id: string;
  title: string;
  purpose: string;
  project: string | null;
  client: string | null;
  business?: string | null;
  agent?: string | null;
  taskTypes: string[];
  triggerContext: string[];
  tags: string[];
  current: boolean;
  lastResultStatus: string;
  lastFailure: string | null;
  recommendedContext: string | null;
  version: string;
  path: string;
  status: string;
  supersededBy: string | null;
};

export type PromptRecommendation = {
  prompt: PromptMatchable;
  score: number;
  reason: string;
  warning: string | null;
};

export type PromptDuplicateGroup = {
  identity: string;
  canonical: PromptRecord;
  duplicates: PromptRecord[];
};

export type PromptCandidateDuplicate = {
  left: PromptRecord;
  right: PromptRecord;
  score: number;
  reason: string;
};

const STOP = new Set([
  "the", "and", "for", "with", "this", "that", "from", "into", "your", "you", "are", "was", "were",
  "one", "use", "using", "only", "not", "any", "all", "can", "have", "has", "been", "will",
]);

export function tokens(value: string): string[] {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function catalogPromptsFromNotes(notes: Array<Pick<VaultNote, "path" | "title" | "type" | "frontmatter" | "body" | "section">>): PromptRecord[] {
  return notes
    .filter((note) => (note.type ?? "").toLowerCase() === "prompt")
    .filter((note) => isOperationalPromptNote(note))
    .map((note) => parsePromptFromFields(note.path, note.frontmatter, note.body, note.title))
    .filter((record): record is PromptRecord => Boolean(record));
}

export function exactDuplicateGroups(prompts: PromptRecord[]): PromptDuplicateGroup[] {
  const groups = new Map<string, PromptRecord[]>();
  for (const prompt of prompts) {
    const list = groups.get(prompt.contentIdentity) ?? [];
    list.push(prompt);
    groups.set(prompt.contentIdentity, list);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([identity, list]) => {
      const sorted = [...list].sort((a, b) => Number(b.current) - Number(a.current) || b.version.localeCompare(a.version));
      return { identity, canonical: sorted[0], duplicates: sorted.slice(1) };
    });
}

function jaccard(a: string[], b: string[]): number {
  const left = new Set(a);
  const right = new Set(b);
  if (!left.size || !right.size) return 0;
  let inter = 0;
  for (const token of left) if (right.has(token)) inter += 1;
  return inter / new Set([...left, ...right]).size;
}

export function candidateDuplicates(prompts: PromptRecord[]): PromptCandidateDuplicate[] {
  const candidates: PromptCandidateDuplicate[] = [];
  for (let i = 0; i < prompts.length; i += 1) {
    for (let j = i + 1; j < prompts.length; j += 1) {
      const left = prompts[i];
      const right = prompts[j];
      if (left.contentIdentity === right.contentIdentity) continue;
      if (left.canonicalPromptId === right.canonicalPromptId) continue;
      const titleScore = jaccard(tokens(left.title), tokens(right.title));
      const purposeScore = jaccard(tokens(left.purpose), tokens(right.purpose));
      const taskScore = jaccard(left.taskTypes.map((item) => item.toLowerCase()), right.taskTypes.map((item) => item.toLowerCase()));
      const score = Math.max(titleScore, (titleScore + purposeScore) / 2) + taskScore * 0.2;
      if (score >= 0.62) {
        candidates.push({
          left,
          right,
          score,
          reason: "Possible duplicate: similar title/purpose. Review before merging.",
        });
      }
    }
  }
  return candidates.sort((a, b) => b.score - a.score);
}

export function searchPrompts(
  prompts: PromptRecord[],
  query: string,
  filters: {
    project?: string;
    client?: string;
    agent?: string;
    model?: string;
    taskType?: string;
    tag?: string;
    status?: string;
  } = {},
): PromptRecord[] {
  const terms = tokens(query);
  return prompts
    .filter((prompt) => {
      if (filters.project && !(prompt.project ?? "").toLowerCase().includes(filters.project.toLowerCase())) return false;
      if (filters.client && !(prompt.client ?? "").toLowerCase().includes(filters.client.toLowerCase())) return false;
      if (filters.agent && !(prompt.agent ?? "").toLowerCase().includes(filters.agent.toLowerCase())) return false;
      if (filters.model && !(prompt.model ?? "").toLowerCase().includes(filters.model.toLowerCase())) return false;
      if (filters.taskType && !prompt.taskTypes.some((item) => item.toLowerCase() === filters.taskType!.toLowerCase())) return false;
      if (filters.tag && !prompt.tags.some((item) => item.toLowerCase() === filters.tag!.toLowerCase())) return false;
      if (filters.status && prompt.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      return true;
    })
    .map((prompt) => {
      if (!terms.length) return { prompt, score: prompt.current ? 1 : 0 };
      let score = 0;
      const hayTitle = prompt.title.toLowerCase();
      const hayPurpose = prompt.purpose.toLowerCase();
      const hayProject = `${prompt.project ?? ""} ${prompt.client ?? ""} ${prompt.business ?? ""}`.toLowerCase();
      const hayTasks = prompt.taskTypes.join(" ").toLowerCase();
      const hayTags = prompt.tags.join(" ").toLowerCase();
      const hayTriggers = prompt.triggerContext.join(" ").toLowerCase();
      const hayBody = prompt.promptBody.toLowerCase();
      for (const term of terms) {
        if (hayTitle.includes(term)) score += 10;
        if (hayPurpose.includes(term)) score += 6;
        if (hayProject.includes(term)) score += 8;
        if (hayTasks.includes(term)) score += 7;
        if (hayTags.includes(term)) score += 5;
        if (hayTriggers.includes(term)) score += 6;
        if (hayBody.includes(term)) score += 2;
      }
      return { prompt, score };
    })
    .filter((item) => !query.trim() || item.score > 0)
    .sort((a, b) => b.score - a.score || a.prompt.title.localeCompare(b.prompt.title))
    .map((item) => item.prompt);
}

export function recommendPrompts(prompts: PromptMatchable[], context: PromptRecommendContext): PromptRecommendation[] {
  const contextText = [context.project, context.client, context.business, context.task, context.query, context.agent]
    .filter(Boolean)
    .join(" ");
  const contextTokens = unique(tokens(contextText));
  if (contextTokens.length < 2) return [];

  const ranked: PromptRecommendation[] = [];
  for (const prompt of prompts) {
    if (!prompt.current) continue;
    let score = 0;
    let taskTypeHits = 0;
    let triggerHits = 0;
    const reasons: string[] = [];

    const projectValue = (prompt.project ?? "").toLowerCase();
    if (context.project && projectValue && context.project.toLowerCase().includes(projectValue.split(" ")[0])) {
      score += 12;
      reasons.push(`project ${prompt.project}`);
    } else if (context.project && tokens(context.project).some((token) => projectValue.includes(token))) {
      score += 10;
      reasons.push(`project ${prompt.project}`);
    }

    if (context.client && prompt.client && context.client.toLowerCase().includes(prompt.client.toLowerCase())) {
      score += 8;
      reasons.push(`client ${prompt.client}`);
    }

    for (const taskType of prompt.taskTypes) {
      const needle = taskType.toLowerCase();
      if (contextTokens.includes(needle) || contextText.toLowerCase().includes(needle)) {
        score += 8;
        taskTypeHits += 1;
        reasons.push(`task ${taskType}`);
      }
    }

    for (const trigger of prompt.triggerContext) {
      const parts = tokens(trigger);
      if (parts.every((part) => contextTokens.includes(part) || contextText.toLowerCase().includes(part))) {
        score += 5;
        triggerHits += 1;
        reasons.push(`context ${trigger}`);
      }
    }

    for (const token of tokens(prompt.title)) {
      if (contextTokens.includes(token)) score += 3;
    }

    const strong = taskTypeHits > 0 || triggerHits >= 2 || reasons.some((reason) => reason.startsWith("project"));
    if (!strong || score < 10) continue;

    const warning = prompt.lastResultStatus === "FAILED" || prompt.lastFailure
      ? (prompt.lastFailure ? `Known failure: ${prompt.lastFailure}` : "This prompt has failure evidence.")
      : null;
    if (warning) score -= 6;
    if (score < 10) continue;

    ranked.push({
      prompt,
      score,
      reason: `You already have a prompt for this: ${prompt.title} v${prompt.version} (${unique(reasons).slice(0, 3).join("; ")}).`,
      warning,
    });
  }

  return ranked.sort((a, b) => b.score - a.score).slice(0, 2);
}

export function currentVersion(prompts: PromptRecord[], canonicalPromptId: string): PromptRecord | null {
  return prompts.find((prompt) => prompt.canonicalPromptId === canonicalPromptId && prompt.current) ?? null;
}

export function versionsFor(prompts: PromptRecord[], canonicalPromptId: string): PromptRecord[] {
  return prompts
    .filter((prompt) => prompt.canonicalPromptId === canonicalPromptId)
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
}
