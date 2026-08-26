import type { ActivityEvent, ActivityEventKind } from "./types";

export function createActivityEvent(
  kind: ActivityEventKind,
  message: string,
  extras?: { toolId?: string; evidence?: string[]; at?: string; id?: string },
): ActivityEvent {
  return {
    id: extras?.id ?? `act-${kind}-${Math.random().toString(36).slice(2, 10)}`,
    kind,
    at: extras?.at ?? new Date().toISOString(),
    message,
    toolId: extras?.toolId,
    evidence: extras?.evidence,
  };
}

export function appendActivity(existing: ActivityEvent[], next: ActivityEvent, max = 80): ActivityEvent[] {
  return [...existing, next].slice(-max);
}
