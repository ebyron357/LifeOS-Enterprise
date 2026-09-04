import type { ActivityEventKind } from "./types";

const SECRET_PATTERN = /(api[_-]?key|secret|token|bearer|authorization|password|private[_-]?key)/i;

export type StructuredLog = {
  event: ActivityEventKind;
  at: string;
  sessionId?: string;
  toolId?: string;
  status?: string;
};

export function redactSecrets(value: string): string {
  if (!value) return value;
  return value
    .replace(/(Bearer\s+)[A-Za-z0-9._\-]+/gi, "$1[redacted]")
    .replace(/((?:api[_-]?key|secret|token|password)\s*[:=]\s*)\S+/gi, "$1[redacted]");
}

export function isSafeToLogKey(key: string): boolean {
  return !SECRET_PATTERN.test(key);
}

export function createStructuredLog(entry: StructuredLog): StructuredLog {
  return {
    event: entry.event,
    at: entry.at,
    sessionId: entry.sessionId,
    toolId: entry.toolId,
    status: entry.status,
  };
}

export function logAgentEvent(entry: StructuredLog): void {
  const safe = createStructuredLog(entry);
  console.info("lifeos_agent_event", safe);
}
