# Incident and Recovery Guide

Scope: the Vercel-hosted Next.js application and the Markdown vault in
`ebyron357/LifeOS-Enterprise`. Procedures are derived from `docs/DEPLOYMENT.md`,
the CI workflows, `scripts/`, and the route/lib implementations.

## 0. First five minutes

1. Establish live identity. Read GitHub `main` **and** the current READY Vercel
   production deployment (ID + Git SHA). Never infer one from the other.
2. Decide whether the failure is build-time (Vercel/CI), runtime (route errors),
   content (vault/links/metadata), or integration (credentials).
3. If production is broken, prefer rollback first, diagnose second.

## 1. Failure point: production build fails on Vercel

**Symptoms** — new deployment shows ERROR; previous deployment stays live.

**Triage**
- Read the Vercel build log for the failing step.
- Reproduce locally: `npm ci && npm run lint && npm run typecheck && npm test && npm run build`.
- Check Dashboard CI on the same commit; CI runs the identical sequence on Node 22.

**Recovery** — Leave the previous READY deployment active. Do not describe a
failed candidate as live. Fix forward with a normal PR; do not rewrite `main`.

## 2. Failure point: bad code reached production

**Recovery (from `docs/DEPLOYMENT.md`)**
1. Identify the exact currently active READY production deployment before
   changing anything.
2. Use Vercel rollback/promote to restore the previous known-good READY
   production deployment.
3. If the defect came from a merged GitHub change, open a revert/fix pull
   request. Never rewrite `main` history.
4. Re-run Dashboard CI, Vault Health, production smoke checks, and any affected
   owner-acceptance rows.
5. Record the resulting deployment ID and Git SHA in the release evidence.

## 3. Failure point: `npm audit --audit-level=high` blocks CI

Dashboard CI fails on any high-or-above advisory before lint/test/build run.

**Triage** — run `npm audit --audit-level=high` locally.
**Recovery** — upgrade the offending package to a patched version, run
`npm ci` to regenerate a consistent lockfile, and re-run the full validation
chain. Do not lower the audit threshold.

## 4. Failure point: Vault Health audit fails

`scripts/audit-vault.ps1` checks required folders, required `.base` files in
`00 Home/Bases/`, required templates in `99 Templates/`, required operational
documents under `docs/`, metadata completeness, and internal links.

**Triage**
```powershell
pwsh -NoProfile -File ./scripts/audit-vault.ps1
pwsh -NoProfile -File ./scripts/validate-vault-links.ps1
```

**Common causes and fixes**
- A required folder was deleted or renamed → restore it (a `.gitkeep`-style
  placeholder note is enough for empty structural folders).
- An active project is missing `type`, `status`, `priority`, `next_action` or
  `review_date` → add the properties per `architecture/METADATA_SCHEMA.md`.
- A broken wikilink → fix the target or the link text.
- README/documentation rows leaking into operational dashboards → tighten the
  dashboard query to filter by `type` rather than folder membership.

Re-run the audit after each repair group until it exits successfully.

## 5. Failure point: dashboards render empty or wrong in Obsidian

Bases and Dataview are **not** executed by the web server. If dashboards are
empty in Obsidian, the cause is local plugin state, not the deployment.

**Recovery**
```powershell
pwsh -NoProfile -File ./scripts/setup-obsidian.ps1
pwsh -NoProfile -File ./scripts/repair-local-vault.ps1
```
Both scripts are required to be idempotent and non-destructive. `.obsidian/` is
git-ignored, so it can be repaired locally without touching the repository.

## 6. Failure point: notes missing from the web portal

The portal is filtered by design. Before assuming a bug, check
`lib/vault/exclusions.ts`:

- The path is under an excluded prefix (`app/`, `lib/`, `components/`, `tests/`,
  `scripts/`, `integrations/`, `.git/`, `.obsidian/`, and others).
- The filename is exactly excluded (`.env*`, `.gitignore`, `package-lock.json`).
- The extension is a credential type (`.pem`, `.key`, `.p12`, `.pfx`, `.crt`).
- The note's frontmatter has `private: true`, `publish: false`, or
  `web_visibility: private`.

If none apply, run the vault index unit tests (`tests/vault-index.test.ts`,
`tests/vault-exclusions.test.ts`) to localise the parsing defect. Treat
exclusions as a privacy control: widen them only deliberately.

## 7. Failure point: writes / change plan not working

**Expected behaviour when unconfigured.** `GET /api/lifeos/change-plan` returns
`enabled:false`, `configured:false`, `mode:"draft-pr-only"`,
`directMainWrites:false`. That is healthy, not broken.

| Symptom | Likely cause | Action |
|---|---|---|
| `401` | Missing or wrong bearer | Supply `LIFEOS_WRITE_SECRET`; confirm it is set in Vercel |
| `403` | Origin rejected | Set `LIFEOS_ALLOWED_ORIGIN` to the exact dashboard origin |
| `409` | Canonical SHA conflict — someone changed the note | Re-read the note and regenerate the change plan |
| `429` | Rate limit window exceeded | Retry; note that in-memory limiting is process-local on serverless |
| `400` on a valid-looking edit | Field/status/priority outside the allowlist, or body over 64 KB | Restrict to `status`/`priority`/`next_action`, `active`/`waiting`/`blocked`/`complete`, `P0`–`P3` |
| Approvals unavailable | Durable store missing | Configure `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; production has no silent memory fallback |

Never "fix" an approval failure by setting `LIFEOS_APPROVAL_STORE=memory` in
production. That flag is local/test only and defeats replay protection.

## 8. Failure point: voice console

| Symptom | Cause | Action |
|---|---|---|
| Console not visible | `LIFEOS_VOICE_ENABLED` not `true` | Enable deliberately |
| `403` from `/api/lifeos/voice/speak` | Origin check failed | Fix `LIFEOS_ALLOWED_ORIGIN` |
| `429` | 30-request rate limit per trusted identity | Back off |
| Falls back to browser TTS | Paid TTS not authorised | Set `OPENAI_API_KEY` plus `LIFEOS_TTS_SECRET` (or `LIFEOS_WRITE_SECRET`). Voice-session tokens are rejected by design |
| Long text truncated | 2000-character cap (`MAX_TTS_CHARS`) | Split the utterance |
| Realtime transport absent | LiveKit room-token minting is deferred | Not a defect |

Safety expectations to verify after any voice change: mute stops microphone
capture, new speech interrupts TTS, and screen share cleans up on Stop and on
navigation away.

## 9. Failure point: integration shows "unavailable"

This is the intended truthful-state model from `docs/CANONICAL_LIVE_STATUS.md`.
ClickUp, Slack, n8n, Vercel actions, Google/Revenue Radar and Hermes are
unavailable until **both** durable approval storage and their own credentials
exist. Do not add a fallback that displays them as connected.

## 10. Full restore / rebuild from scratch

Because the vault is plain Markdown in Git, disaster recovery is a clone.

```bash
git clone https://github.com/ebyron357/LifeOS-Enterprise
cd LifeOS-Enterprise
npm ci
cp .env.example .env.local     # fill in only what you intend to enable
npm run dev
```

Then:
1. Open the repository as an Obsidian vault and run
   `scripts/setup-obsidian.ps1`.
2. Create a Vercel project linked to the GitHub repository and re-enter
   environment variables (start with `LIFEOS_WRITE_ENABLED=false`).
3. Deploy from `main` and verify `/` and `/dashboard`.
4. Run the full validation chain and `scripts/audit-vault.ps1`.
5. Work through the production checklist in `docs/DEPLOYMENT.md` and record the
   deployment ID and SHA.

## 11. Post-incident record

Update `docs/VAULT_REPAIR_REPORT.md` with repairs completed, validation
evidence, final pass/fail state, and any remaining credential-only or local-UI
actions. Keep `docs/CANONICAL_LIVE_STATUS.md` consistent with reality, but do
not hard-code a "current production SHA" into it.
