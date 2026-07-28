import type { TranscriptEntry, TranscriptRole } from "./types";

export function createTranscriptEntry(
  role: TranscriptRole,
  text: string,
  options?: { interim?: boolean; temporary?: boolean },
): TranscriptEntry {
  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    interim: options?.interim,
    temporary: options?.temporary ?? true,
    createdAt: Date.now(),
  };
}

export function upsertInterimTranscript(entries: TranscriptEntry[], text: string): TranscriptEntry[] {
  const withoutInterim = entries.filter((entry) => !(entry.role === "user" && entry.interim));
  if (!text.trim()) return withoutInterim;
  return [...withoutInterim, createTranscriptEntry("user", text, { interim: true, temporary: true })];
}

export function appendFinalUserTranscript(entries: TranscriptEntry[], text: string): TranscriptEntry[] {
  const withoutInterim = entries.filter((entry) => !(entry.role === "user" && entry.interim));
  if (!text.trim()) return withoutInterim;
  return [...withoutInterim, createTranscriptEntry("user", text, { interim: false, temporary: true })];
}

export const transcriptRoleLabels: Record<TranscriptRole, string> = {
  user: "You",
  lifeos: "LifeOS",
  system: "System",
  tool: "Tool",
  confirmation: "Confirmation",
  error: "Error",
};
