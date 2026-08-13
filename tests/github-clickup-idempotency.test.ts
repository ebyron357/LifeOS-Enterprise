import { describe, it, expect, beforeEach } from "vitest";
import {
  deriveIdempotencyKey,
  checkAndSet,
  guardEvent,
  InMemoryIdempotencyStore,
} from "@/lib/automation/idempotency";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REPO = "ebyron357/LifeOS-Enterprise";

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    action: "opened",
    repository: { full_name: REPO },
    issue: { number: 52, html_url: "https://github.com/ebyron357/LifeOS-Enterprise/issues/52" },
    sender: { login: "test-actor" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deriveIdempotencyKey
// ---------------------------------------------------------------------------

describe("deriveIdempotencyKey", () => {
  it("uses X-GitHub-Delivery header when present", () => {
    const key = deriveIdempotencyKey(
      { deliveryId: "abc-delivery-123" },
      makePayload(),
    );
    expect(key).toBe("abc-delivery-123");
  });

  it("falls back to composite key when header is absent", () => {
    const key = deriveIdempotencyKey({}, makePayload());
    expect(key).toBe(`fallback:${REPO}:52:opened`);
  });

  it("fallback uses pull_request number when issue is absent", () => {
    const payload = {
      action: "synchronize",
      repository: { full_name: REPO },
      pull_request: { number: 7 },
    };
    const key = deriveIdempotencyKey({}, payload);
    expect(key).toBe(`fallback:${REPO}:7:synchronize`);
  });

  it("fallback uses 0 and 'unknown' for completely bare payloads", () => {
    const key = deriveIdempotencyKey({}, {});
    expect(key).toBe("fallback:unknown:0:unknown");
  });

  it("two distinct delivery IDs produce distinct keys", () => {
    const k1 = deriveIdempotencyKey({ deliveryId: "del-1" }, makePayload());
    const k2 = deriveIdempotencyKey({ deliveryId: "del-2" }, makePayload());
    expect(k1).not.toBe(k2);
  });
});

// ---------------------------------------------------------------------------
// checkAndSet
// ---------------------------------------------------------------------------

describe("checkAndSet", () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  it("returns proceed=true with label 'first' for a new key", async () => {
    const decision = await checkAndSet(store, "unique-key-001");
    expect(decision.proceed).toBe(true);
    if (decision.proceed) {
      expect(decision.label).toBe("first");
      expect(decision.key).toBe("unique-key-001");
    }
  });

  it("persists the record after first processing", async () => {
    await checkAndSet(store, "unique-key-002");
    expect(store.size).toBe(1);
  });

  it("returns proceed=false with label 'duplicate' for a repeated key", async () => {
    await checkAndSet(store, "repeated-key");
    const second = await checkAndSet(store, "repeated-key");
    expect(second.proceed).toBe(false);
    if (!second.proceed) {
      expect(second.label).toBe("duplicate");
      expect(second.key).toBe("repeated-key");
      expect(second.prior.processedAt).toBeTruthy();
    }
  });

  it("does not create a second record on duplicate call", async () => {
    await checkAndSet(store, "dup-key");
    await checkAndSet(store, "dup-key");
    expect(store.size).toBe(1);
  });

  it("preserves distinct events: different keys both proceed", async () => {
    const d1 = await checkAndSet(store, "del-A");
    const d2 = await checkAndSet(store, "del-B");
    expect(d1.proceed).toBe(true);
    expect(d2.proceed).toBe(true);
    expect(store.size).toBe(2);
  });

  it("simulates transport retry: six deliveries of the same key → exactly one first", async () => {
    const key = "del-LIFEOS-AUTO-PROOF-20260811-A";
    const timestamps = [
      "2026-08-11T06:04:48.179Z",
      "2026-08-11T06:10:30.631Z",
      "2026-08-11T06:15:01.370Z",
      "2026-08-11T06:15:01.372Z",
      "2026-08-11T06:19:35.415Z",
      "2026-08-11T07:33:05.691Z",
    ];

    // n8n processes webhook deliveries sequentially; simulate that order.
    const results = [];
    for (const _ts of timestamps) {
      results.push(await checkAndSet(store, key));
    }

    const firstCount = results.filter((r) => r.proceed).length;
    const dupCount = results.filter((r) => !r.proceed).length;

    expect(firstCount).toBe(1);
    expect(dupCount).toBe(5);
    expect(store.size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// guardEvent (end-to-end convenience wrapper)
// ---------------------------------------------------------------------------

describe("guardEvent", () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  it("first delivery proceeds", async () => {
    const result = await guardEvent(
      store,
      { deliveryId: "gh-del-xyz" },
      makePayload(),
    );
    expect(result.proceed).toBe(true);
    expect(result.key).toBe("gh-del-xyz");
  });

  it("retry of same delivery is suppressed", async () => {
    const headers = { deliveryId: "gh-del-xyz" };
    await guardEvent(store, headers, makePayload());
    const retry = await guardEvent(store, headers, makePayload());
    expect(retry.proceed).toBe(false);
  });

  it("same issue, different delivery IDs are not suppressed", async () => {
    const payload = makePayload();
    const r1 = await guardEvent(store, { deliveryId: "del-1" }, payload);
    const r2 = await guardEvent(store, { deliveryId: "del-2" }, payload);
    expect(r1.proceed).toBe(true);
    expect(r2.proceed).toBe(true);
  });
});
