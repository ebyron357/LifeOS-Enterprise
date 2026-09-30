# LifeOS Enterprise — Canonical Live Status

**Status date:** 2026-09-30  
**Canonical repository:** `ebyron357/LifeOS-Enterprise`  
**Canonical branch:** `main`  
**Production URL:** `https://lifeos-enterprise.vercel.app/`  
**Released version:** `1.0.0`  
**Last application-code baseline on main:** `d66467e2701e5f11fa12b0b2f60e5257756c988c` — PR #78 My Life mega navigation  
**Prior recorded baselines:** `abf6c8264bed2578382d8eb60adc572762b6ee17` — PR #75 LifeOS closeout (voice #58, widgets/game #42, resource provenance, owner manual v2.0); `fc0729de8475c6c2f6b6343a99d9fac392a5442e` — Life Map and Dashboards hub (owner commit); `62a9df908608bf2c584f17be82d7f3754a582065` — PR #74 MAPS operating layer; `21b921ce8c7acf98132748f3466800468e0664a1` — PR #73 Continuity checkpoint path fix; `03657b621c2956c095c2e168f11ff159c3449651` — PR #72 Continuity checkpoint writes; `6bf7e2aff9920ba868de7381e0e68ae75d9866c7` — PR #71 Resource review; `df4b182bae4884a482bd2efd652a07783f9b6111` — PR #70 Prompt Intelligence; `1ae3fddb65b75c08127b7fef995d5ff37926f80a` — PR #69 Continuity; `45d5d018599e7b7d308523a3f38bf9ccf62e2c94` — PR #68 GitHub evidence; `7982c92a7080f60f9fb70e7c66c5220b8178bc35` — PR #64 performance hardening.  
**Live identity source:** GitHub `main` for repository head; Vercel production deployment for deployed SHA/ID. Query both at report or acceptance time.  
**Owner acceptance:** not complete  
**Owner/operator manual:** `80 SOPs/LifeOS Owner's Operating Manual.md` (v2.2, step-by-step)

## Governing status

**LifeOS Enterprise V1.0 is built on `main`. After PR #64, PRs #66 and #68 merged Resource Intelligence intake and GitHub evidence, PR #69 merged Continuity / resume packages, PR #70 merged Prompt Intelligence, PR #71 merged the Resource Intelligence owner review/disposition surface, and PR #72 merged governed Continuity checkpoint writes. All six are merged and were observed in a READY Vercel production deployment on 2026-09-25. PR #73 (per-save unique checkpoint paths) merged afterwards and was observed READY in production on 2026-09-30. On 2026-09-30, PR #74 (MAPS), the owner's Life Map / Dashboards commit, and the PR #75 closeout also merged; production deployment `dpl_8FhMhJpUPMd5YgS8bJw6MTk8e5Q9` was observed READY at the PR #75 merge `abf6c82`. The PR #79 status docs (`95e71d1`) and PR #78, the My Life mega navigation (`d66467e`), merged afterwards the same day. Repository head and production deployment identity are live operational facts and must be read from GitHub and Vercel when a status report or acceptance run begins.**

The prior status edition is superseded because the post-#60 security corrective, the unified-command-center rebuild, and the Resource Intelligence, Continuity, and Prompt Intelligence slices have since merged and deployed:

- PR #60 merged the operational closeout: interactive widgets/game loop, conversation voice, screen-share safety, server-authoritative approvals, and owner-acceptance evidence.
- PR #61 merged the post-#60 corrective: owner write authorization, durable approval storage, exact approved payload execution, server-TTS hardening, check-in XP correction, and visible screen-share requesting state.
- PR #62 merged and production-deployed the intent-first LifeOS rebuild: one Command Center, persistent Ask LifeOS, Projects, Today, Capture, Journal, Learning, Files, Automations, Integrations, Settings/More, and the previous widget dashboard retained as an advanced workspace.
- PR #63 merged the Resource Intelligence/governance reconciliation and subsequently produced a READY production deployment at `6f6d5d7578c03b89abe781cc11351ad66cb07c51`.
- PR #64 merged performance and dependency hardening at `7982c92a7080f60f9fb70e7c66c5220b8178bc35`: bounded-concurrency vault parsing, reduced layout-write churn, asynchronous idempotency I/O, deferred optional voice-console loading, corrected agent-language instructions, and dependency remediation.
- PRs #66 and #68 merged Universal Resource Intelligence durable intake and the read-only, source-grounded GitHub evidence processor.
- PR #69 merged derived Continuity / resume packages on the existing Command Center and Today surfaces, `GET /api/lifeos/continuity`, and the "where was I" voice command.
- PR #70 merged Prompt Intelligence: canonical `type: prompt` records under `40 Resources/Prompts/`, the `/prompts` library, exact-body dedupe and versioning, Continuity prompt linkage, and the read-only `GET /api/lifeos/prompts` agent API.
- PR #71 merged Resource Intelligence owner review: `/resources/review` with six state lanes and suggestion-only duplicate candidates, and `POST /api/lifeos/resource-review`, which records an owner-entered disposition through a draft PR only. It also hardened request handling for intake and review and fixed an intermittent test-teardown CI failure.
- PR #72 merged governed Continuity checkpoint writes: `POST /api/lifeos/continuity/checkpoint` snapshots the derived resume package into a new `Command Center/Checkpoints/` record through a draft PR only, and the resume card gained a Save checkpoint control. It also fixed checkpoint YAML quoting and taught the frontmatter parser to decode JSON-quoted scalars. A follow-up makes each checkpoint path unique per save so concurrent saves cannot collide.

Automated validation and a successful production deployment do **not** equal owner acceptance. Until the owner completes `docs/OWNER_ACCEPTANCE_WORKBOOK.md`, the allowed success statement remains:

**AGENT VALIDATION PASSED — OWNER ACCEPTANCE STILL REQUIRED**

Do not report LifeOS as owner-accepted or fully operational for credential-gated writes, paid TTS, or live microphone/screen workflows until those owner-only checks are completed.

This document is the single source of truth for capability state, governance, acceptance state, and status-reporting rules. It deliberately does **not** hard-code a permanent "current production SHA": a documentation-only merge can trigger Vercel and change that SHA without changing application code. GitHub and Vercel are authoritative for live repository/deployment identity. Earlier reports, draft-PR descriptions, percentages, and phase summaries are superseded whenever they conflict with this document or fresher operational evidence.

## 2026-09-30 closeout edition

This edition is written for the change set in the closeout pull request from `claude/eager-noether-oacbox`, which carries this document. Everything in the list below reaches production only when that PR is merged and Vercel reports the new deployment READY. Check GitHub and Vercel before claiming any of it is live.

- **Voice (#58) production polish.**
  - Truthful OpenAI provider state: it is configured only when a paid-TTS authorization secret exists.
  - `response_format` fix.
  - Voice picker, with an OpenAI allowlist validated server-side.
  - BCP-47 locale speech, with a visible warning instead of silent language switching.
  - In-flight cancellation on Interrupt and Stop.
  - Duplicate-turn protection.
  - Settings persistence independent of the session fetch.
  - Error recovery without a reload.
  - Capability and privacy notes, and a visible fallback indicator.
  - Deterministic concise spoken replies.
  - 44 px controls.
- **Widgets and game (#42).**
  - Per-widget and route error boundaries.
  - A Repair layout that actually repairs.
  - Mobile reorder skips hidden widgets.
  - Confirmed resets, with a game-state backup.
  - Streak recovery restores the pre-gap streak.
  - Boss battles require every step.
  - Canonical-source side quests (health, learning, money, relationships, service, personal growth; a quest appears only when a vault record exists).
  - Reward, level-up, and achievement announcements.
  - An end-of-day results panel.
  - A read-only LifeOS Game card on `/today`.
  - Non-vacuous browser tests.
- **Resource Intelligence.**
  - Server-side GitHub source evidence at write time, recorded as `## Source Evidence`, `evidence_status`, and `evidence_inspected_at`.
  - A deterministic `processor_route` per source type.
  - Repeated captures before merge update the one open draft PR.
  - Clean 502 on upstream read failure.
  - The manual template matches the record contract.
- **Platform.**
  - The frontmatter parser reads YAML block lists; tags return for about 59 notes and all Resource records.
  - An app icon removes the favicon 404 console error.
  - Dashboard CI timeouts.
  - `next@16.3.8`, plus `brace-expansion` advisory fixes.
- **Documentation.** Owner manual v2.0, refreshed owner acceptance workbook, and this reconciliation.

**PR #74 — MAPS operating layer.** This PR was reviewed separately and merged to `main` on 2026-09-30 as `62a9df908608bf2c584f17be82d7f3754a582065`. Before merge, its candidate `1ca01b2f7624b22cde8ea002822e5e61747825ae` was green on every check:
- Dashboard CI, including WebKit
- Vault audit
- MAPS structural validation
- Security review

It had no unresolved review threads. `.github/workflows/maps-integrity.yml` now runs `scripts/validate-maps.ps1` daily at 06:17 UTC and keeps the run record as the `maps-integrity-check-evidence` artifact.

## Current production capabilities

The following capabilities are present on the current production deployment:

- Canonical Obsidian Markdown vault and numbered vault structure
- Vault audit and validation scripts
- Unified root Command Center at `/`
- Persistent Ask LifeOS entry point at `/conversation`
- Intent-first project workspace at `/projects`
- Today workspace at `/today`
- Quick Capture / Inbox at `/inbox`
- Journal at `/journal`
- Learning at `/learning`
- Search-first files experience at `/files`
- Automation status at `/automations`
- Integration health at `/integrations`
- Settings and More / advanced surfaces
- Prior widget dashboard preserved at `/dashboard`
- Accessible desktop/mobile application shell and command palette
- Interactive project Command Board and project resume flows
- Browser-staged project changes and approval-package generation
- Conflict-safe, draft-PR-only canonical persistence architecture
- Conversation voice architecture, voice settings, interruption controls, and browser fallback
- Owner-initiated screen sharing with safety-state handling
- Server-authoritative approval policy
- Durable-approval fail-closed architecture
- GitHub health telemetry with live production read
- Safe empty-state Revenue Radar
- Truthful integration-state model that does not invent connectivity
- Resource Intelligence durable intake (PR #66) and read-only GitHub evidence inspection (PR #68), with disposition still owner-reviewed
- Derived Continuity / resume packages on Command Center and Today (PR #69); they do not invent Slack, ClickUp, email, or calendar state
- Prompt Intelligence canonical library at `/prompts` (PR #70); it reuses `40 Resources/Prompts/` and does not create a second command center or a second intake path
- Resource Intelligence owner review at `/resources/review` (PR #71): state lanes, due-review flags, suggestion-only duplicate candidates, and a fail-closed draft-PR decision write
- Continuity checkpoint saving from the resume card (PR #72): fail-closed, create-only, draft-PR-only

## Current integration and activation state

The production Command Center currently distinguishes available/connected capabilities from unconfigured integrations.

| Capability | Current production state | Activation / owner requirement |
|---|---|---|
| LifeOS vault | AVAILABLE | Canonical Markdown vault is read server-side. |
| GitHub health | CONNECTED | Public repository-health read is succeeding. |
| Quick Capture | AVAILABLE, browser-local | Captures are stored in the current browser until intentionally promoted through the governed write path. |
| Canonical writes / external tool approvals | FAIL-CLOSED unless configured | `LIFEOS_WRITE_ENABLED=true`, `LIFEOS_WRITE_SECRET`, durable approval storage, and tool-specific credentials are required. |
| Durable approvals | UNAVAILABLE until Redis is configured | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. No silent production memory fallback. |
| ClickUp execution | UNAVAILABLE | Requires durable approval storage plus `CLICKUP_API_TOKEN` and `CLICKUP_LIST_ID`. |
| Slack execution | UNAVAILABLE | Requires durable approval storage plus `SLACK_BOT_TOKEN` and `SLACK_DEFAULT_CHANNEL`. |
| n8n execution | UNAVAILABLE | Requires durable approval storage plus `N8N_WEBHOOK_URL`. |
| Vercel execution from LifeOS | UNAVAILABLE | Production itself is deployed on Vercel, but LifeOS-triggered deploy actions require durable approval storage plus `VERCEL_TOKEN` and `VERCEL_PROJECT_ID`. |
| Hermes delegated runtime | UNAVAILABLE | Requires a real `HERMES_ENDPOINT` and `HERMES_TOKEN`; no connection is claimed without them. |
| Google Workspace / Revenue Radar source | UNAVAILABLE | Connect an approved source only when intentionally enabling Revenue Radar. |
| Paid server TTS | UNCONFIGURED on 2026-09-30 (`OPENAI_API_KEY is missing`); browser voice active | `OPENAI_API_KEY` plus `LIFEOS_TTS_SECRET` or `LIFEOS_WRITE_SECRET`; public voice-session tokens cannot spend the key. After the closeout merge, OpenAI is reported configured only when both exist, and the browser calls it only after the owner types the secret. |

## Explicit V1 boundaries

- Canonical changes never write directly to `main`; they must use a reviewable draft-PR path.
- Browser staging and Quick Capture are not represented as canonical persistence.
- External writes remain fail-closed when durable approval storage or required credentials are absent.
- Owner approval is required for consequential writes, production-affecting actions, credentials, and other governed actions.
- Voice and screen-share quality/permission checks require real owner browser interaction.
- LiveKit realtime voice remains deferred unless separately approved and implemented.
- Haitian Creole and French voice locales may be prepared but are not represented as owner-verified without live evidence.
- Dataview and Obsidian Bases are not executed by the web server.
- Hermes is an adapter contract, not an active runtime, until a real endpoint/token and reachability evidence exist.
- Resource Intelligence intake and GitHub evidence are in production. The owner review/disposition surface (`/resources/review`, `POST /api/lifeos/resource-review`) is in production (PR #71); on 2026-09-25 its service reported `enabled: true, configured: false`, so decision writes stay fail-closed until the owner secret and GitHub token are both configured. PR #75 added write-time GitHub source evidence, deterministic source-type routing to existing processors/SOPs/templates, and open-draft-PR dedupe; production reported these capabilities on 2026-09-30. Semantic dedupe, automated YouTube/web/PDF processors, asset factory, implementation router/executor, automated scoring, the staleness monitor, and the Issue #56 end-to-end candidate proof (which needs the owner write path configured) remain unimplemented.
- Continuity derives resume state from vault + GitHub + optional checkpoint notes and does not reconstruct unauthorized external systems. Governed checkpoint writes through a draft PR are in production (PR #72); on 2026-09-25 the service reported `enabled: true, configured: false`, so they stay fail-closed until the owner secret and GitHub token are both configured.
- Prompt Intelligence is read-only on the web: prompts are authored as vault Markdown and changed through the existing draft-PR path. It adds no new write API, and recommendation is deterministic and conservative, not model-generated.

## Verified release evidence

### Verified release evidence — 2026-09-30 closeout

Agent validation on the closeout branch, after all fix sets were merged:
- `npm ci`: PASS.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm run lint`: PASS. `npm run typecheck`: PASS.
- `npm test`: 72 files, 516 tests, all passing.
- `npm run build`: PASS.
- `pwsh -File scripts/audit-vault.ps1`: PASS (162 notes).
- Playwright against the production build, Chromium desktop 1440 / laptop 1024 / mobile 390: 166 passed, 5 skipped (expected desktop-only and mobile-only splits, plus one pre-existing skip).
- A scan of 19 routes (including `/life-map` and `/dashboards`) found no console errors, page errors, or HTTP ≥ 400.
- WebKit was not available in the agent container; Dashboard CI ran it on the PR.
- PR #75 final head `c94d360` (with `main` at `fc0729d` merged in) was green on Dashboard CI (including WebKit), the PowerShell vault audit, MAPS structural validation, and the Cursor security review. All 11 review threads were resolved. It was squash-merged to `main` as `abf6c82`.

Production observed after the PR #78 merge (2026-09-30, about 21:11 UTC):
- Deployment `dpl_8TmFFkc8y3bvBzrfZNDR2YCZbnaj` was READY at `d66467e` (= `main`) and aliased to `lifeos-enterprise.vercel.app`.
- `/` served the top bar with the **My Life** button (`aria-expanded="false"`, no `aria-haspopup`), **Life Map**, and **Ask LifeOS**. `resource-intake` returned 200 with the same fail-closed, draft-PR-only capabilities.
- Vercel reported no runtime errors for the previous 7 days.
- Local validation of PR #78 with `main` merged in: lint, typecheck, 516 unit tests, build, vault audit, and MAPS passed. Chromium Playwright (1440/1024/390): 175 passed, 5 skipped, including 9 new My Life tests. The 19-route scan found no console errors.

Production observed after the PR #75 merge (2026-09-30, about 20:49 UTC):
- Deployment `dpl_8FhMhJpUPMd5YgS8bJw6MTk8e5Q9` was READY at `abf6c82` (= `main`) and aliased to `lifeos-enterprise.vercel.app`.
- The `agent/session`, `voice/session`, `game/session`, `resource-intake`, `resource-review`, `continuity/checkpoint`, and `change-plan` APIs returned 200.
- `resource-intake` reported `openDraftPrDedupe: true` and per-source `processorRoute`s with only GitHub automated. `game/session` served categorized side quests (health, learning, money, personal growth) and boss battles with steps.
- `/today` rendered the LifeOS Game card and `/life-map` rendered all 13 zones.
- The governed write services still reported `configured: false` with `mode: draft-pr-only` and `directMainWrites: false`. Voice reported `activeProvider: browser` (`OPENAI_API_KEY` missing). Durable approvals were missing (`UPSTASH_REDIS_REST_*`).
- Vercel reported no runtime errors for the previous 7 days.

Earlier production observation on 2026-09-30, before the closeout merged:
- Deployment `dpl_CxF6WThSCMDdrftveicnzcN3FCC6` was READY at `21b921c` (= `main`).
- `/` returned 200. The `continuity/checkpoint`, `resource-review`, `resource-intake`, `change-plan`, `voice/session`, `agent/session`, and `game/session` APIs returned 200.
- The governed write services reported `configured: false`, and `directMainWrites` was false.
- Voice reported `activeProvider: browser`. Durable approvals were missing (`UPSTASH_REDIS_REST_*`).
- Vercel reported no runtime errors for the previous 7 days.

This is agent evidence, not owner acceptance.

### Last application-code baseline

PR #75 merged the LifeOS closeout at `abf6c8264bed2578382d8eb60adc572762b6ee17` and was observed READY in production at deployment `dpl_8FhMhJpUPMd5YgS8bJw6MTk8e5Q9` on 2026-09-30.

Before it, PR #73 merged the per-save unique Continuity checkpoint path at `21b921ce8c7acf98132748f3466800468e0664a1` and was observed READY in production at deployment `dpl_CxF6WThSCMDdrftveicnzcN3FCC6` on 2026-09-30.

### Prior application-code baselines

PR #72 merged Continuity checkpoint writes at:

- Git SHA: `03657b621c2956c095c2e168f11ff159c3449651`
- Exact PR head `e6b1271` passed Dashboard CI (lint, typecheck, unit tests, build, Playwright including WebKit), the PowerShell vault audit, and the Cursor security review before merge.

PR #71 merged Resource Intelligence owner review/disposition at:

- Git SHA: `6bf7e2aff9920ba868de7381e0e68ae75d9866c7`
- Exact PR head `1ac283b` passed Dashboard CI (lint, typecheck, 358 unit tests, build, Playwright including WebKit), the PowerShell vault audit, and the Cursor security review before merge.

PR #70 merged Prompt Intelligence at:

- Git SHA: `df4b182bae4884a482bd2efd652a07783f9b6111`
- Commit: `feat(prompts): add canonical Prompt Intelligence on existing vault (#70)`
- 2026-09-25 agent revalidation on this exact SHA: `npm ci` PASS, `npm run lint` PASS, `npm run typecheck` PASS, `npm test` PASS (61 files / 333 tests), `npm run build` PASS (34 static pages), `npm audit --audit-level=high` PASS (0 vulnerabilities), `pwsh -File ./scripts/audit-vault.ps1` PASS (162 notes).
- Playwright was not rerun in this revalidation.

PR #64 merged application performance/dependency hardening at:

- Git SHA: `7982c92a7080f60f9fb70e7c66c5220b8178bc35`
- Commit: `perf: optimize vault and dashboard hot paths (#64)`
- Exact PR head passed Dashboard CI and Vault Health before merge.
- Validation recorded 54 test files / 298 tests, lint/typecheck/build pass, vault audit pass, and `npm audit --audit-level=high` with 0 vulnerabilities.

### Deployment identity rule

Deployment IDs and production SHAs are runtime evidence, not durable constants inside this file.

At the start of every status report, release check, rollback, or owner-acceptance session:

1. Read current GitHub `main`.
2. Read the Vercel production deployment for `lifeos-enterprise`.
3. Record the exact deployment ID + Git SHA in the report/workbook evidence for that session.
4. If production points at a documentation-only commit after the last application-code baseline, state both facts separately.
5. Never infer deployed identity from repository head, and never use a historical deployment ID as though it were current.

Historical evidence: on 2026-09-30, PR #73 (`21b921c`) was observed READY in Vercel production at deployment `dpl_CxF6WThSCMDdrftveicnzcN3FCC6`. PR #64 was verified READY in Vercel at deployment `dpl_8QLjAaMSmsYs1VKAUBKCxqipXGCx`. PR #65 was a documentation-only reconciliation and subsequently produced a different READY production SHA without changing application code. On 2026-09-25, PR #72 (`03657b6`) was observed READY in Vercel production at deployment `dpl_5asoJhWnXGbZWuqEg3iHomF3Z9VE`, with `GET /api/lifeos/continuity/checkpoint` returning 200. PR #71 (`6bf7e2a`) was observed READY in Vercel production at deployment `dpl_EXRsoAHWuM7DqPUhqCE43XSZYLrs`, with `/resources/review` and `GET /api/lifeos/resource-review` returning 200. Earlier the same day, PR #70 (`df4b182`) was observed READY at deployment `dpl_3A2f8wqnpBTkHiyHcFTftXpiQF6c`, and PR #69 (`1ae3fdd`) at `dpl_HLUQQeSkJbpePq4j2EDWXgYkt9SE`. These IDs are retained only as evidence examples, not as current-state claims.

### PR #62 agent validation

The merged PR recorded:

- `npm ci` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm test` — PASS, 54 files / 298 tests
- `npm run build` — PASS
- `npm audit --audit-level=high` — PASS, 0 vulnerabilities
- `pwsh -File ./scripts/audit-vault.ps1` — PASS, 156 notes
- Dedicated Command Center Playwright run — 23 passed / 1 failed on the last full two-project run; the affected resume case then passed 2/2 after the fix
- Full parallel Playwright suite — **not claimed as a clean final rerun**

### PR #61 agent validation

The merged corrective recorded:

- `npm ci` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm test` — PASS, 49 files / 286 tests
- `npm run build` — PASS
- `npm audit --audit-level=high` — PASS, 0 vulnerabilities
- Vault audit — PASS
- Full E2E first run — 92 passed, 4 WebKit desktop failures caused by browser/context closure; isolated serial WebKit desktop rerun — 6/6 passed

These are agent validation records, not owner acceptance.

## Repository disposition

- PR #25: historical AI standards source package; closed/superseded and governed by its recorded disposition.
- PR #30: merged portal implementation.
- PR #31: closed as superseded by merged portal and v1.0 release.
- PR #32: closed because the requested Windows audit ran on the wrong host OS.
- PRs #38 and #39: closed as superseded by release PR #40.
- PR #40: merged v1.0 release.
- PR #41: merged production release closeout.
- PR #55: closed as superseded; its conversation/agent-runtime work was incorporated upstream into the #60/#61/#62 line and must not remain an active competing implementation path.
- PR #59: closed and superseded; do not revive.
- PR #60: merged operational closeout onto `main` at `c7d4e3507d7837e100a35a9eacb903e9319f1803`.
- PR #61: merged post-#60 security/write/TTS/state corrective onto `main` at `3ddf934afc12261bdf68e2bd86059f80db0a22db`.
- PR #62: merged unified AI Command Center rebuild at `46a2514893b4e3557911403274cba695b1c89384`.
- PR #63: merged Resource Intelligence/governance reconciliation at `6f6d5d7578c03b89abe781cc11351ad66cb07c51`; a READY production deployment exists for this SHA.
- PR #64: merged the last recorded application-code baseline at `7982c92a7080f60f9fb70e7c66c5220b8178bc35`.
- PR #65: merged documentation/governance reconciliation only; it did not change application runtime behavior.
- PR #66: merged Universal Resource Intelligence intake foundation at `c693c73`.
- PR #67: merged documentation-only live-identity reconciliation.
- PR #68: merged source-grounded GitHub evidence processor at `45d5d018599e7b7d308523a3f38bf9ccf62e2c94`.
- PR #69: merged derived Continuity / resume packages at `1ae3fddb65b75c08127b7fef995d5ff37926f80a`; a READY production deployment exists for this SHA.
- PR #70: merged Prompt Intelligence at `df4b182bae4884a482bd2efd652a07783f9b6111`; a READY production deployment exists for this SHA.
- PR #71: merged Resource Intelligence owner review/disposition at `6bf7e2aff9920ba868de7381e0e68ae75d9866c7`; a READY production deployment exists for this SHA.
- PR #72: merged Continuity checkpoint writes at `03657b621c2956c095c2e168f11ff159c3449651`; a READY production deployment exists for this SHA. It merged before its review fix landed; the per-save path nonce followed in PR #73.
- PR #73: merged per-save unique checkpoint paths at `21b921ce8c7acf98132748f3466800468e0664a1`; READY in production on 2026-09-30 (superseded as baseline by PR #75).
- PR #74: merged MAPS operating layer at `62a9df908608bf2c584f17be82d7f3754a582065` on 2026-09-30 (candidate `1ca01b2` green on every check). Mostly governance, routing, and CI; its only runtime change is the `next@16.3.8` security patch.
- Owner commit `fc0729de8475c6c2f6b6343a99d9fac392a5442e` (2026-09-30) added the `/life-map` personal operating map and the `/dashboards` launch hub; a READY production deployment exists for this SHA.
- PR #75: merged the LifeOS closeout at `abf6c8264bed2578382d8eb60adc572762b6ee17` on 2026-09-30 (final head `c94d360` green on every check); READY in production at `dpl_8FhMhJpUPMd5YgS8bJw6MTk8e5Q9`.
- PR #79: merged the post-closeout status docs and manual F18 at `95e71d19bf5752d1aae81b63175334236098af7e`.
- PR #78: merged the "My Life" mega navigation at `d66467e2701e5f11fa12b0b2f60e5257756c988c` (head `830ca40` green on every check, with the Escape focus, disclosure semantics, and e2e coverage fixes). Production deployment identity for this SHA is recorded under the verified release evidence.

## Remaining owner work

Each item is written step-by-step in `80 SOPs/LifeOS Owner's Operating Manual.md` (Part K for credentials, Part J and `docs/OWNER_ACCEPTANCE_WORKBOOK.md` for acceptance).

1. Done by the agent on the owner's instruction: PR #74 (MAPS) merged as `62a9df9` and the closeout PR #75 merged as `abf6c82` on 2026-09-30, and production `dpl_8FhMhJpUPMd5YgS8bJw6MTk8e5Q9` was observed READY at `abf6c82`. Re-check production identity (step 2) before starting acceptance, because later merges change it.
2. At the start of the acceptance session, query Vercel and record the exact READY production deployment ID + SHA in the workbook.
3. Complete the workbook's live checks on desktop and phone: navigation journeys, widgets and game, and voice with a real microphone and speakers (voice choice, preview, interrupt, mute, recovery, persistence). Also check screen share request, deny, and stop.
4. Decide whether to enable governed writes, and only then configure the credentials together:
   - `LIFEOS_WRITE_SECRET`
   - `LIFEOS_GITHUB_TOKEN`
   - `LIFEOS_ALLOWED_ORIGIN`
   - for approvals, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

   As of 2026-09-30, none of the governed write services are configured, so they stay fail-closed.
5. Decide on the command-center redesign: PR #76, and PR #80, which consolidates #76 with the merged My Life menu. As of 2026-09-30 about 21:15 UTC, neither is mergeable:
   - Both fail the unit test `answers what to do next without inventing agent work`. The redesigned home no longer shows the "Hermes is unavailable" honest-status text that the test enforces.
   - Both conflict with `main` in `components/os/AppShell.tsx` and `app/os.css`.
   - #76 also drops the `.os-page-header`, `.os-grid`, and `.os-grid-2` styles that other pages still use; #80 keeps them.

   Keep one of them: restore the honest Hermes status and bring it up to date with current `main`. Close the other.
6. After step 4, run the Issue #56 acceptance candidate (`vercel-labs/knowledge-agent-template`) through `/inbox` and `/resources/review` (workbook Section I).
7. Optional paid voice: `OPENAI_API_KEY` plus a TTS/write secret. This is a billing decision.
8. Complete the local Windows/Obsidian visual checks on the actual workstation.

## Active platform work after V1 acceptance

These are platform-development items, not reasons to misreport the current deployment as absent:

1. Universal Resource Intelligence: automated YouTube/web/PDF processors, asset factory, implementation router/executor, semantic dedupe, staleness monitor. The Issue #56 acceptance candidate runs once the owner write path is configured.
2. Continuity: Graphiti/Cognee only as later vault indexes.
3. Prompt Intelligence authoring/versioning through the existing draft-PR path and canonicalization of prompts extracted by Resource Intelligence.
4. Platform capability registry.
5. Cognitive-tool registry and scoring.
6. Marketplace opportunity registry and money-lane data model.
7. Shared GitHub cognitive-friendly standard rollout.
8. Reusable release-audit integration across projects.
9. Persistent agent-role implementation where useful.

## Status-reporting rule

Future LifeOS status reports must:

1. Start from this document and current production evidence.
2. Separate shipped code, production deployment identity, inactive configuration, external credentials, local-device validation, owner acceptance, and future enhancements.
3. Never assign a changing completion percentage.
4. Never treat future-phase platform features as V1 deployment blockers.
5. Update this complete document when governing status changes instead of creating competing status fragments.
6. Use only **AGENT VALIDATION PASSED — OWNER ACCEPTANCE STILL REQUIRED** for automated success until the owner signs the workbook.
7. Verify live GitHub head and Vercel production identity at report time; never maintain a self-invalidating hard-coded "current SHA" in this document.
