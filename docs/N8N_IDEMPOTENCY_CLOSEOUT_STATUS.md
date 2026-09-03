# LifeOS n8n Runtime Idempotency Closeout — Execution Status

Date: 2026-09-01 (session executed 2026-09-03 UTC)
Operator: Claude (implementation lead), on behalf of the LifeOS owner
Governing task: ClickUp `86e2re8eg` — "Verify GitHub → n8n → ClickUp runtime idempotency"
Live workflow: `LifeOS Proof: GitHub -> n8n -> ClickUp`, ID `wMv71FmDq4aN5ZsE`, host `bwa357.app.n8n.cloud`

This document is the canonical record of the 2026-09-01 closeout execution. It is
updated in place as the closeout progresses; the latest committed revision
supersedes all earlier ones.

## Completed steps (verified)

### 1. Functional source of truth retrieved
PR #53 (`feat(automation): add idempotency guard to GitHub → n8n → ClickUp pipeline`,
merge commit `9895c4a805032f677a9acb90e4747669ed92bfc4`) is merged on `main`:

- `lib/automation/idempotency.ts` — key = `X-GitHub-Delivery` only; fail-closed
  quarantine when the header is absent; atomic claim-before-mutation
  (`checkAndSet`); `first` / `duplicate` / `quarantine` decision labels; 30-day TTL;
  durable store required in production.
- `integrations/n8n/github-clickup-idempotent.workflow.json` — reference workflow
  using an `O_EXCL` filesystem store.

Per the closeout directive, the filesystem `O_EXCL` store is **not** used (n8n Cloud
has no persistent writable local disk contract). The durability mechanism is
**option 1 of the stated preference order: the n8n native Data Table datastore.**

### 2. Live workflow backed up (restorable)
- Pre-change live version `81b58657-92fb-4b3a-a563-5ff0dcbe2d9f` (created
  2026-08-11, confirmed to predate PR #53 and to contain the stale token
  `LIFEOS-AUTO-PROOF-20260811-A` with zero idempotency) is:
  - retained in n8n workflow version history (restorable in place), and
  - captured verbatim in git:
    `integrations/n8n/backups/wMv71FmDq4aN5ZsE.v81b58657.pre-idempotency-closeout.json`.
- No competing production workflow was created.

### 3. Durable idempotency datastore created
- n8n Data Table `lifeos_idempotency_claims`, ID `If9iZ2Y9nrf7jk6w`, project
  `uT8Ftrt6nJQHYI9U` (same project as the workflow).
- Columns: `key`, `executionId`, `source`, `deliveryId`, `repository`,
  `eventAction`, `issueNumber`, `token`, `claimedAt` (+ auto `id`, `createdAt`,
  `updatedAt`). Rows are durable (instance database), survive restarts, and act as
  a per-delivery audit log.

### 4. Live workflow updated IN PLACE (draft saved server-side)
Applied as **one atomic `update_workflow` call: 32 operations, 17 nodes, 0
validation warnings**, version name
`Idempotency closeout: durable Data Table claim gate (PR #53 contract)`.

Preserved untouched: `GitHub Issue Event` trigger node (same node ID, same
`webhookId 4c138af1-be0a-4fef-8985-ead494014a23`, same GitHub hook 664213475,
repo `ebyron357/LifeOS-Enterprise`, events `issues`), GitHub + ClickUp
credentials, ClickUp task target `86e2re8eg`, manual proof branch (`Run Proof`).

Changes:
- `Normalize Event` now extracts `X-GitHub-Delivery` from the trigger headers
  (header availability confirmed empirically from retained execution #70) and
  derives `gh:<deliveryId>:<repo>:<event>:<action>:<issueNumber>`; missing header
  ⇒ quarantine (fail-closed).
- `Validate Proof` no longer hardcodes the stale token; it validates the dated
  controlled family `LIFEOS-IDEMPOTENCY-FINAL-\d{8}-[A-Z0-9]+` and extracts the
  actual token into evidence.
- New gate before any ClickUp mutation:
  `Has Idempotency Key?` → `Claim Idempotency Key` (Data Table insert) →
  `Settle Claim Visibility` (2s) → `Fetch Claims For Key` → `Decide First Or
  Duplicate` (lowest-row-id winner election) → `First Delivery?` →
  `Add Proof Comment` (first) / `Log Suppressed Event` (duplicate · quarantine) /
  `Fail Closed - Datastore Error` (store read/write errors, wired from both Data
  Table nodes' error outputs).
- `Set Status Review` ClickUp mutation removed ⇒ exactly **one** ClickUp mutation
  per first delivery, and post-closeout task status can no longer be regressed by
  future proof events.
- Manual branch normalized (`Normalize Manual Proof`) and repointed at proof
  issue #57; manual runs are keyed `manual:<repo>:<issue>:<updated_at>` through
  the same gate.

Full definition: `integrations/n8n/wMv71FmDq4aN5ZsE.idempotent-closeout.workflow.json`.

Atomicity rationale: each delivery durably inserts its own claim row before any
mutation; the auto-increment row id is assigned by the single instance database,
so concurrent duplicates deterministically agree on one winner (lowest id) after
the 2-second visibility-settlement window. All anomaly paths fail closed (no
ClickUp mutation).

### 5. Fresh controlled proof token + proof event staged
- Token: `LIFEOS-IDEMPOTENCY-FINAL-20260901-A34795` (stale token fully removed
  from the runtime).
- Proof issue: [ebyron357/LifeOS-Enterprise#57](https://github.com/ebyron357/LifeOS-Enterprise/issues/57)
  carries the token in title and body. Its `opened` delivery was received by the
  still-active pre-fix version and was intentionally inert there (stale-token
  validation cannot match), which doubles as a control result.

## Remaining steps

1. Publish the saved draft version of `wMv71FmDq4aN5ZsE` (activates the gate).
2. Controlled proof delivery 1: edit issue #57 (append a proof-execution line) ⇒
   real GitHub `issues.edited` delivery ⇒ expect PROCESS, exactly 1 ClickUp
   comment on `86e2re8eg`, claim row 1 written.
3. Redeliver the same delivery twice (same `X-GitHub-Delivery`, same payload,
   injected through the same trigger) ⇒ expect SUPPRESS ×2, zero additional
   ClickUp mutations, `duplicate` decisions visible in execution data and claim
   rows 2–3 in the Data Table.
4. Record full evidence on ClickUp `86e2re8eg` and set the completed status if
   and only if all expected results hold; otherwise leave `review` with the exact
   blocker.

## Current blocker (if this section is present in the latest revision)

The n8n MCP connector for this Claude session lost its authentication mid-run
(immediately after the draft update was saved) and did not recover within ~1 hour
of retries. Publish, execution reads, and Data Table reads are impossible without
it; the n8n host is unreachable directly from this environment by network policy
(confirmed: HTTPS CONNECT to `bwa357.app.n8n.cloud` is refused, 403).

Owner action required: re-authorize the **n8n** connector in claude.ai →
Settings → Connectors, then re-run the closeout from "Remaining steps" above.
Production state is safe meanwhile: the ACTIVE workflow version is still the
unmodified pre-fix version (inert to the new token family), the corrected version
is saved as the workflow's draft, and the backup remains restorable.
