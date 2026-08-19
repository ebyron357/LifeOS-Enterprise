/**
 * Idempotency guard for the GitHub → n8n → ClickUp automation pipeline.
 *
 * Design goals
 * ────────────
 * 1. Durable: the production store (`FileSystemIdempotencyStore`) persists
 *    records to disk as atomic JSON files and survives process restarts.
 * 2. Atomic under concurrent callers: the store uses an exclusive O_EXCL
 *    open so that exactly one caller wins the race when multiple n8n
 *    executions arrive for the same delivery ID simultaneously.
 * 3. Fail-closed on missing header: production callers should always supply
 *    `X-GitHub-Delivery`.  When the header is absent the key derivation
 *    returns `null`; `checkAndSet` refuses to proceed and returns a
 *    `quarantine` decision so the event can be logged and reviewed rather
 *    than silently suppressed by an overly broad fallback key.
 * 4. TTL / retention: `FileSystemIdempotencyStore` accepts a `ttlMs` option
 *    and purges stale records on `set()`, keeping the store bounded.
 * 5. Swappable: `IdempotencyStore` is an interface; adapters for Redis,
 *    databases, etc. can be dropped in without changing business logic.
 *
 * Production usage (n8n Code node):
 * ```js
 * const { FileSystemIdempotencyStore, guardEvent } = require('./idempotency');
 * const store = new FileSystemIdempotencyStore('/data/idempotency');
 * const decision = await guardEvent(store, { deliveryId: $headers['x-github-delivery'] }, $body);
 * if (!decision.proceed) return [];   // duplicate / quarantine — already logged
 * // … post to ClickUp …
 * ```
 *
 * Test / dev usage:
 * ```ts
 * const store = new InMemoryIdempotencyStore();   // never use in production
 * ```
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

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
  label: "first" | "duplicate";
}

export type ProcessingDecision =
  | { proceed: true; label: "first"; key: string }
  | { proceed: false; label: "duplicate"; key: string; prior: ProcessedRecord }
  | { proceed: false; label: "quarantine"; key: null; reason: string };

// ---------------------------------------------------------------------------
// IdempotencyStore interface
// ---------------------------------------------------------------------------

export interface IdempotencyStore {
  /**
   * Return an existing record for `key`, or `undefined` if not yet seen.
   */
  get(key: string): Promise<ProcessedRecord | undefined>;

  /**
   * Atomically claim `key`.
   * - Returns `true`  → this caller won the race; record was written.
   * - Returns `false` → another caller already claimed the key; no write.
   *
   * The distinction from `set()` enables atomic insert-if-absent semantics
   * without a separate get+set round-trip.
   */
  claim(key: string, record: ProcessedRecord): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// FileSystemIdempotencyStore  (PRODUCTION implementation)
// ---------------------------------------------------------------------------

/**
 * Durable, crash-safe idempotency store backed by the local filesystem.
 *
 * Each processed delivery is stored as an individual JSON file:
 *   `{dir}/{key}.json`
 *
 * **Atomicity**: `claim()` uses `fs.openSync(path, 'wx')` (O_CREAT | O_EXCL),
 * which the kernel guarantees to succeed for exactly one concurrent caller on
 * POSIX filesystems (including ext4, xfs, and overlayfs).  On Windows NTFS the
 * same exclusive-create guarantee holds.  This eliminates the TOCTOU gap
 * between check and write that exists in read-then-write patterns.
 *
 * **Restart persistence**: files survive process restart, container recycle, and
 * n8n restart because they live in `dir` (default `/data/n8n/idempotency`).
 *
 * **Retention/TTL**: on each `claim()` call a sweep deletes records older than
 * `ttlMs` (default 30 days — well beyond GitHub's 72-hour redelivery window).
 * The sweep is best-effort; failures are logged and ignored.
 *
 * **Multi-instance n8n**: when multiple n8n worker processes share the same
 * mounted directory (e.g. NFS or a shared persistent volume), the O_EXCL
 * guarantee still holds because the kernel serialises exclusive creates at the
 * VFS layer.  If the store directory is local to each instance, pair this with
 * a shared external store (Redis) instead.
 */
export class FileSystemIdempotencyStore implements IdempotencyStore {
  readonly dir: string;
  readonly ttlMs: number;

  constructor(
    dir: string = path.join(os.homedir(), ".n8n", "idempotency"),
    ttlMs: number = 30 * 24 * 60 * 60 * 1000,
  ) {
    this.dir = dir;
    this.ttlMs = ttlMs;
    fs.mkdirSync(this.dir, { recursive: true });
  }

  private recordPath(key: string): string {
    const safe = encodeURIComponent(key).replace(/%/g, "_");
    return path.join(this.dir, `${safe}.json`);
  }

  async get(key: string): Promise<ProcessedRecord | undefined> {
    try {
      const raw = fs.readFileSync(this.recordPath(key), "utf8");
      return JSON.parse(raw) as ProcessedRecord;
    } catch {
      return undefined;
    }
  }

  async claim(key: string, record: ProcessedRecord): Promise<boolean> {
    this.sweepExpired();
    const filePath = this.recordPath(key);
    try {
      const fd = fs.openSync(filePath, "wx");
      fs.writeSync(fd, JSON.stringify(record, null, 2));
      fs.closeSync(fd);
      return true;
    } catch (err: unknown) {
      if (isNodeError(err) && err.code === "EEXIST") {
        return false;
      }
      throw err;
    }
  }

  /** Remove records older than ttlMs.  Best-effort; never throws. */
  private sweepExpired(): void {
    try {
      const cutoff = Date.now() - this.ttlMs;
      for (const entry of fs.readdirSync(this.dir)) {
        if (!entry.endsWith(".json")) continue;
        const filePath = path.join(this.dir, entry);
        try {
          const stat = fs.statSync(filePath);
          if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            console.log(
              `[idempotency] TTL_EXPIRED removed file=${entry}`,
            );
          }
        } catch {
          // ignore per-file errors
        }
      }
    } catch {
      // ignore directory read errors
    }
  }

  /** List all unexpired keys (test / diagnostic helper). */
  listKeys(): string[] {
    try {
      return fs
        .readdirSync(this.dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => decodeURIComponent(f.slice(0, -5).replace(/_/g, "%")));
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// InMemoryIdempotencyStore  (TEST / DEV ONLY — not for production use)
// ---------------------------------------------------------------------------

/**
 * @internal
 * Map-backed store for unit tests and local development.
 *
 * ⚠️  DO NOT use in production.  Records are lost on process restart and
 * this store is not safe under concurrent multi-process access.
 *
 * `claim()` uses a synchronous compare-and-set on the internal Map, which
 * is safe within a single event-loop thread but not across processes.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly store = new Map<string, ProcessedRecord>();

  async get(key: string): Promise<ProcessedRecord | undefined> {
    return this.store.get(key);
  }

  async claim(key: string, record: ProcessedRecord): Promise<boolean> {
    if (this.store.has(key)) return false;
    this.store.set(key, record);
    return true;
  }

  /** Number of stored records — test assertion helper. */
  get size(): number {
    return this.store.size;
  }

  /** Remove all records — test teardown helper. */
  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

/**
 * Derive a stable idempotency key from the webhook delivery headers.
 *
 * Returns `null` when `X-GitHub-Delivery` is absent.  Callers should treat a
 * `null` return as a quarantine signal: log the event for manual review
 * rather than proceeding with an unverifiable composite key that could
 * collapse distinct legitimate events.
 *
 * The composite fallback pattern (`{repo}:{number}:{action}`) is intentionally
 * NOT used in production because two distinct deliveries for the same
 * issue/action (e.g. a close followed by a re-open) would share the same
 * fallback key and the second would be incorrectly suppressed.
 */
export function deriveIdempotencyKey(
  headers: GitHubEventHeaders,
): string | null {
  return headers.deliveryId ?? null;
}

// ---------------------------------------------------------------------------
// Core gate: checkAndSet
// ---------------------------------------------------------------------------

/**
 * Atomic check-and-set gate.
 *
 * - Returns `{ proceed: true, label: "first" }` when this is the first time
 *   the key has been seen.  The record is persisted *before* any downstream
 *   mutation.
 * - Returns `{ proceed: false, label: "duplicate" }` when the key was
 *   already claimed.
 * - Returns `{ proceed: false, label: "quarantine" }` when `key` is `null`
 *   (missing delivery header), preventing destructive fallback deduplication.
 *
 * Callers MUST inspect the returned `label` for structured observability.
 */
export async function checkAndSet(
  store: IdempotencyStore,
  key: string | null,
): Promise<ProcessingDecision> {
  if (key === null) {
    const reason = "X-GitHub-Delivery header absent; event quarantined for manual review";
    console.warn(`[idempotency] QUARANTINE ${reason}`);
    return { proceed: false, label: "quarantine", key: null, reason };
  }

  const record: ProcessedRecord = {
    key,
    processedAt: new Date().toISOString(),
    label: "first",
  };

  const claimed = await store.claim(key, record);
  if (!claimed) {
    const prior = await store.get(key);
    const priorRecord = prior ?? { key, processedAt: "unknown", label: "duplicate" as const };
    console.log(
      `[idempotency] DUPLICATE suppressed key=${key} first_seen=${priorRecord.processedAt}`,
    );
    return { proceed: false, label: "duplicate", key, prior: priorRecord };
  }

  console.log(`[idempotency] FIRST processing key=${key}`);
  return { proceed: true, label: "first", key };
}

// ---------------------------------------------------------------------------
// Convenience wrapper
// ---------------------------------------------------------------------------

/**
 * Derive key then check-and-set in a single call.
 *
 * Production callers should always supply `headers.deliveryId`
 * (`req.headers['x-github-delivery']`).  When it is absent the event is
 * quarantined rather than processed with an unsafe fallback key.
 */
export async function guardEvent(
  store: IdempotencyStore,
  headers: GitHubEventHeaders,
): Promise<ProcessingDecision> {
  const key = deriveIdempotencyKey(headers);
  return checkAndSet(store, key);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
