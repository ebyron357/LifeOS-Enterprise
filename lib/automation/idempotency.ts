/**
 * Idempotency guard for the GitHub → n8n → ClickUp automation pipeline.
 *
 * Design:
 *  - Derives a stable, content-addressed key from a GitHub webhook payload.
 *  - The key is: `{delivery_id}:{action}:{repo_full_name}:{issue_number}` where
 *    delivery_id is the value of the `X-GitHub-Delivery` header (or a fallback
 *    computed from the stable payload fields when the header is absent, e.g. in
 *    test scenarios).
 *  - The store is a Map<string, ProcessedRecord> that callers may back with a
 *    durable key-value store (e.g. n8n Static Data, Redis, or a file) by
 *    providing a custom IdempotencyStore implementation.
 *  - `checkAndSet` is the only mutation path; it returns the processing
 *    decision synchronously for test scenarios or awaits the store for prod.
 */

export interface GitHubEventHeaders {
  /** Value of X-GitHub-Delivery header. */
  deliveryId?: string;
}

export interface GitHubEventPayload {
  action?: string;
  repository?: {
    full_name?: string;
  };
  issue?: {
    number?: number;
  };
  pull_request?: {
    number?: number;
  };
}

export interface ProcessedRecord {
  key: string;
  processedAt: string;
  label: "first" | "retry" | "duplicate";
}

export type ProcessingDecision =
  | { proceed: true; label: "first"; key: string }
  | { proceed: false; label: "duplicate"; key: string; prior: ProcessedRecord };

export interface IdempotencyStore {
  get(key: string): Promise<ProcessedRecord | undefined>;
  set(key: string, record: ProcessedRecord): Promise<void>;
}

/**
 * In-process Map-backed store.  Suitable for single-process deployments and
 * unit tests.  Replace with a Redis/file-backed adapter for multi-instance
 * deployments.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly store = new Map<string, ProcessedRecord>();

  async get(key: string): Promise<ProcessedRecord | undefined> {
    return this.store.get(key);
  }

  async set(key: string, record: ProcessedRecord): Promise<void> {
    this.store.set(key, record);
  }

  /** Expose size for test assertions. */
  get size(): number {
    return this.store.size;
  }

  /** Clear all records (test helper). */
  clear(): void {
    this.store.clear();
  }
}

/**
 * Derive a stable idempotency key from webhook headers + payload.
 *
 * Priority order:
 *  1. `X-GitHub-Delivery` header — globally unique per delivery attempt.
 *     When GitHub retries the same logical event it reuses the same delivery
 *     ID, so this is the ideal key.
 *  2. Fallback composite key built from stable payload fields when the header
 *     is unavailable (e.g. manually triggered test events).
 */
export function deriveIdempotencyKey(
  headers: GitHubEventHeaders,
  payload: GitHubEventPayload,
): string {
  if (headers.deliveryId) {
    return headers.deliveryId;
  }

  const action = payload.action ?? "unknown";
  const repo = payload.repository?.full_name ?? "unknown";
  const itemNumber =
    payload.issue?.number ?? payload.pull_request?.number ?? 0;

  return `fallback:${repo}:${itemNumber}:${action}`;
}

/**
 * Atomic check-and-set gate.
 *
 * Returns `{ proceed: true }` for the first-seen delivery of a key and
 * `{ proceed: false }` for any subsequent delivery of the same key.
 *
 * Callers MUST log the returned `label` for observability.
 */
export async function checkAndSet(
  store: IdempotencyStore,
  key: string,
): Promise<ProcessingDecision> {
  const prior = await store.get(key);
  if (prior !== undefined) {
    console.log(
      `[idempotency] DUPLICATE suppressed key=${key} first_seen=${prior.processedAt}`,
    );
    return { proceed: false, label: "duplicate", key, prior };
  }

  const record: ProcessedRecord = {
    key,
    processedAt: new Date().toISOString(),
    label: "first",
  };
  await store.set(key, record);
  console.log(`[idempotency] FIRST processing key=${key}`);
  return { proceed: true, label: "first", key };
}

/**
 * Convenience: derive key then check-and-set in a single call.
 */
export async function guardEvent(
  store: IdempotencyStore,
  headers: GitHubEventHeaders,
  payload: GitHubEventPayload,
): Promise<ProcessingDecision> {
  const key = deriveIdempotencyKey(headers, payload);
  return checkAndSet(store, key);
}
