import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  deriveIdempotencyKey,
  checkAndSet,
  guardEvent,
  FileSystemIdempotencyStore,
  InMemoryIdempotencyStore,
  type ProcessingDecision,
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
  it("returns the delivery ID when present", () => {
    const key = deriveIdempotencyKey({ deliveryId: "abc-delivery-123" });
    expect(key).toBe("abc-delivery-123");
  });

  it("returns null when delivery header is absent (fail-closed)", () => {
    const key = deriveIdempotencyKey({});
    expect(key).toBeNull();
  });

  it("two distinct delivery IDs produce distinct keys", () => {
    const k1 = deriveIdempotencyKey({ deliveryId: "del-1" });
    const k2 = deriveIdempotencyKey({ deliveryId: "del-2" });
    expect(k1).not.toBe(k2);
  });
});

// ---------------------------------------------------------------------------
// checkAndSet — shared behaviour across store implementations
// ---------------------------------------------------------------------------

function runCheckAndSetSuite(label: string, makeStore: () => InMemoryIdempotencyStore | FileSystemIdempotencyStore) {
  describe(`checkAndSet (${label})`, () => {
    let store: ReturnType<typeof makeStore>;

    beforeEach(() => {
      store = makeStore();
    });

    it("returns proceed=true / label='first' for a new key", async () => {
      const decision = await checkAndSet(store, "unique-key-001");
      expect(decision.proceed).toBe(true);
      if (decision.proceed) {
        expect(decision.label).toBe("first");
        expect(decision.key).toBe("unique-key-001");
      }
    });

    it("returns proceed=false / label='duplicate' for a repeated key", async () => {
      await checkAndSet(store, "repeated-key");
      const second = await checkAndSet(store, "repeated-key");
      expect(second.proceed).toBe(false);
      if (!second.proceed && second.label === "duplicate") {
        expect(second.prior.processedAt).toBeTruthy();
      }
    });

    it("returns quarantine decision when key is null (missing header)", async () => {
      const decision = await checkAndSet(store, null);
      expect(decision.proceed).toBe(false);
      expect(decision.label).toBe("quarantine");
      if (!decision.proceed && decision.label === "quarantine") {
        expect(decision.key).toBeNull();
        expect(decision.reason).toContain("X-GitHub-Delivery");
      }
    });

    it("preserves distinct events: different keys both proceed", async () => {
      const d1 = await checkAndSet(store, "del-A");
      const d2 = await checkAndSet(store, "del-B");
      expect(d1.proceed).toBe(true);
      expect(d2.proceed).toBe(true);
    });

    it("incident replay: six sequential deliveries of the same key → exactly one first", async () => {
      const key = "del-LIFEOS-AUTO-PROOF-20260811-A";
      // Six timestamps matching the original incident (issue #52)
      const results: ProcessingDecision[] = [];
      for (let attempt = 0; attempt < 6; attempt += 1) {
        results.push(await checkAndSet(store, key));
      }
      const firstCount = results.filter((r) => r.proceed).length;
      expect(firstCount).toBe(1);
      expect(results.filter((r) => !r.proceed && r.label === "duplicate").length).toBe(5);
    });
  });
}

// Run against both implementations
runCheckAndSetSuite("InMemoryIdempotencyStore", () => new InMemoryIdempotencyStore());

// ---------------------------------------------------------------------------
// InMemoryIdempotencyStore — concurrent duplicate claim (single-thread)
// ---------------------------------------------------------------------------

describe("InMemoryIdempotencyStore — concurrent duplicate claim", () => {
  it("exactly one caller wins when many concurrent claims arrive for the same key", async () => {
    const store = new InMemoryIdempotencyStore();
    const key = "concurrent-key";

    // Fire 20 concurrent claims without awaiting individually
    const decisions = await Promise.all(
      Array.from({ length: 20 }, () => checkAndSet(store, key)),
    );

    const winners = decisions.filter((d) => d.proceed);
    expect(winners.length).toBe(1);
    expect(decisions.filter((d) => !d.proceed && d.label === "duplicate").length).toBe(19);
  });
});

// ---------------------------------------------------------------------------
// FileSystemIdempotencyStore — durable persistence tests
// ---------------------------------------------------------------------------

describe("FileSystemIdempotencyStore", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "idempotency-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("persists a record to disk and reads it back", async () => {
    const store = new FileSystemIdempotencyStore(tmpDir);
    await checkAndSet(store, "del-persistent");
    const record = await store.get("del-persistent");
    expect(record).toBeDefined();
    expect(record?.label).toBe("first");
    expect(record?.processedAt).toBeTruthy();
  });

  it("survives process restart: new store instance sees prior claims", async () => {
    // First 'process': claim the key
    const store1 = new FileSystemIdempotencyStore(tmpDir);
    const first = await checkAndSet(store1, "del-restart-test");
    expect(first.proceed).toBe(true);

    // Simulate restart: construct a new store pointing at the same dir
    const store2 = new FileSystemIdempotencyStore(tmpDir);
    const after = await checkAndSet(store2, "del-restart-test");
    expect(after.proceed).toBe(false);
    expect(after.label).toBe("duplicate");
  });

  it("concurrent callers: exactly one wins the O_EXCL race", async () => {
    const store = new FileSystemIdempotencyStore(tmpDir);
    const key = "del-concurrent-fs";

    const decisions = await Promise.all(
      Array.from({ length: 10 }, () => checkAndSet(store, key)),
    );

    const winners = decisions.filter((d) => d.proceed);
    expect(winners.length).toBe(1);
    expect(decisions.filter((d) => !d.proceed && d.label === "duplicate").length).toBe(9);
  });

  it("TTL expiry: expired records are swept and the key can be re-claimed", async () => {
    // Use a very short TTL of 1 ms so records expire immediately
    const store = new FileSystemIdempotencyStore(tmpDir, 1);

    // Claim key
    const first = await checkAndSet(store, "del-ttl-key");
    expect(first.proceed).toBe(true);

    // Wait just long enough for the file mtime to register as expired
    await new Promise((r) => setTimeout(r, 10));

    // The next claim on any key triggers a sweep that removes expired files,
    // then attempts to claim a different key (to trigger the sweep)
    await checkAndSet(store, "del-trigger-sweep");

    // Now the original key's file should be gone; re-claim must succeed
    const reclaim = await checkAndSet(store, "del-ttl-key");
    expect(reclaim.proceed).toBe(true);
  });

  it("listKeys returns stored keys", async () => {
    const store = new FileSystemIdempotencyStore(tmpDir);
    await checkAndSet(store, "key-one");
    await checkAndSet(store, "key-two");
    const keys = store.listKeys();
    expect(keys).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// guardEvent — convenience wrapper (fail-closed when header absent)
// ---------------------------------------------------------------------------

describe("guardEvent", () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  it("first delivery proceeds", async () => {
    const result = await guardEvent(store, { deliveryId: "gh-del-xyz" }, makePayload());
    expect(result.proceed).toBe(true);
    expect(result.key).toBe("gh-del-xyz");
  });

  it("retry of same delivery is suppressed", async () => {
    const headers = { deliveryId: "gh-del-xyz" };
    await guardEvent(store, headers, makePayload());
    const retry = await guardEvent(store, headers, makePayload());
    expect(retry.proceed).toBe(false);
    expect(retry.label).toBe("duplicate");
  });

  it("same issue, different delivery IDs are not suppressed", async () => {
    const payload = makePayload();
    const r1 = await guardEvent(store, { deliveryId: "del-1" }, payload);
    const r2 = await guardEvent(store, { deliveryId: "del-2" }, payload);
    expect(r1.proceed).toBe(true);
    expect(r2.proceed).toBe(true);
  });

  it("quarantines event when delivery header is absent (fail-closed)", async () => {
    const result = await guardEvent(store, {}, makePayload());
    expect(result.proceed).toBe(false);
    expect(result.label).toBe("quarantine");
  });
});


// ---------------------------------------------------------------------------
// Importable n8n workflow artifact
// ---------------------------------------------------------------------------

describe("GitHub → ClickUp n8n workflow artifact", () => {
  it("is valid JSON and retains the durable fail-closed idempotency gate", () => {
    const workflowPath = path.join(
      process.cwd(),
      "integrations/n8n/github-clickup-idempotent.workflow.json",
    );
    const workflowText = fs.readFileSync(workflowPath, "utf8");
    const workflow = JSON.parse(workflowText) as {
      nodes?: Array<{ name?: string; parameters?: { jsCode?: string } }>;
    };

    expect(Array.isArray(workflow.nodes)).toBe(true);
    expect(workflow.nodes?.some((node) => node.name === "Idempotency Gate")).toBe(true);
    expect(workflowText).toContain("fs.openSync(filePath, 'wx')");
    expect(workflowText).toContain("_idempotencyDecision: 'quarantine'");
    expect(workflowText).not.toContain("fallback:");
  });
});
