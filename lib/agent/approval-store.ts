import type { AuthoritativeApproval } from "./approvals";

export type ApprovalStoreBacking = {
  records: Map<string, AuthoritativeApproval>;
  nonces: Set<string>;
};

export type ApprovalStore = {
  id: string;
  available: boolean;
  unavailableReason: string | null;
  get(id: string): Promise<AuthoritativeApproval | undefined>;
  set(approval: AuthoritativeApproval): Promise<void>;
  hasNonce(nonce: string): Promise<boolean>;
  /** Returns true when this caller newly claimed the nonce. */
  addNonce(nonce: string, ttlSeconds: number): Promise<boolean>;
};

const APPROVAL_PREFIX = "lifeos:approval:";
const NONCE_PREFIX = "lifeos:approval-nonce:";

export function createSharedMemoryBacking(): ApprovalStoreBacking {
  return { records: new Map(), nonces: new Set() };
}

export function createMemoryApprovalStore(backing: ApprovalStoreBacking = createSharedMemoryBacking()): ApprovalStore {
  return {
    id: "memory",
    available: true,
    unavailableReason: null,
    async get(id) {
      return backing.records.get(id);
    },
    async set(approval) {
      backing.records.set(approval.id, approval);
    },
    async hasNonce(nonce) {
      return backing.nonces.has(nonce);
    },
    async addNonce(nonce) {
      if (backing.nonces.has(nonce)) return false;
      backing.nonces.add(nonce);
      return true;
    },
  };
}

function createUnavailableStore(reason: string): ApprovalStore {
  return {
    id: "unavailable",
    available: false,
    unavailableReason: reason,
    async get() {
      return undefined;
    },
    async set() {
      throw new Error(reason);
    },
    async hasNonce() {
      return false;
    },
    async addNonce() {
      throw new Error(reason);
    },
  };
}

async function redisCommand(url: string, token: string, command: Array<string | number>): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error(`Approval store request failed with ${response.status}.`);
  }
  const payload = await response.json() as { result?: unknown; error?: string };
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

export function createRedisApprovalStore(url: string, token: string): ApprovalStore {
  return {
    id: "redis",
    available: true,
    unavailableReason: null,
    async get(id) {
      const raw = await redisCommand(url, token, ["GET", `${APPROVAL_PREFIX}${id}`]);
      if (typeof raw !== "string" || !raw) return undefined;
      return JSON.parse(raw) as AuthoritativeApproval;
    },
    async set(approval) {
      const ttl = Math.max(60, Math.ceil((Date.parse(approval.expiresAt) - Date.now()) / 1000) + 3600);
      await redisCommand(url, token, ["SET", `${APPROVAL_PREFIX}${approval.id}`, JSON.stringify(approval), "EX", ttl]);
    },
    async hasNonce(nonce) {
      const result = await redisCommand(url, token, ["EXISTS", `${NONCE_PREFIX}${nonce}`]);
      return result === 1 || result === "1";
    },
    async addNonce(nonce, ttlSeconds) {
      const result = await redisCommand(url, token, ["SET", `${NONCE_PREFIX}${nonce}`, "1", "EX", Math.max(60, ttlSeconds), "NX"]);
      return result === "OK";
    },
  };
}

export function approvalStorageConfigured(env: Record<string, string | undefined> = process.env): boolean {
  if (env.LIFEOS_APPROVAL_STORE === "none") return false;
  if (env.LIFEOS_APPROVAL_STORE === "memory") return true;
  const nodeEnv = env.NODE_ENV ?? process.env.NODE_ENV;
  if (nodeEnv === "test" && env.LIFEOS_APPROVAL_STORE !== "redis") return true;
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

export function describeApprovalStorage(env: Record<string, string | undefined> = process.env): {
  configured: boolean;
  id: string;
  reason: string | null;
} {
  if (env.LIFEOS_APPROVAL_STORE === "none") {
    return { configured: false, id: "unavailable", reason: "Approval storage is disabled." };
  }
  const nodeEnv = env.NODE_ENV ?? process.env.NODE_ENV;
  if (env.LIFEOS_APPROVAL_STORE === "memory" || (nodeEnv === "test" && env.LIFEOS_APPROVAL_STORE !== "redis")) {
    return { configured: true, id: "memory", reason: null };
  }
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return { configured: true, id: "redis", reason: null };
  }
  return {
    configured: false,
    id: "unavailable",
    reason: "Durable approval storage is not configured. Write execution is fail-closed.",
  };
}

let testOverride: ApprovalStore | null = null;
let processStore: ApprovalStore | null = null;

function buildApprovalStore(env: Record<string, string | undefined>): ApprovalStore {
  const described = describeApprovalStorage(env);
  if (!described.configured) {
    return createUnavailableStore(described.reason || "Approval storage is unavailable.");
  }
  if (described.id === "redis" && env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return createRedisApprovalStore(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  }
  return createMemoryApprovalStore();
}

export function setApprovalStoreForTests(store: ApprovalStore | null): void {
  testOverride = store;
  processStore = null;
}

export function getApprovalStore(env: Record<string, string | undefined> = process.env): ApprovalStore {
  if (env === process.env && testOverride) return testOverride;
  if (env !== process.env) return buildApprovalStore(env);
  if (!processStore) processStore = buildApprovalStore(env);
  return processStore;
}
