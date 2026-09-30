# Changelog

All notable changes to LifeOS Enterprise are documented in this file.

## [Unreleased] — 2026-09-30 LifeOS closeout (claude/eager-noether-oacbox)

### Security

- Pin `next@16.3.8` (GHSA-vcvr-r3jv-pc5j, critical `next/og` RCE) and take lockfile-only `brace-expansion` fixes so `npm audit --audit-level=high` passes again.

### Fixed — voice (#58)

- OpenAI TTS sends `response_format` (the documented parameter) instead of `format`.
- OpenAI voice is reported configured only when a paid-TTS authorization secret also exists. The client never auto-selects it and only calls it after the owner types the secret.
- Interrupt, Stop conversation, and newer replies cancel in-flight turn and speech requests, so stale replies never speak and clips never overlap.
- Added a voice picker (browser voices for the locale; OpenAI allowlist validated server-side), BCP-47 locale speech, and a visible warning instead of silent language switching.
- Settings load from browser storage independently of the session fetch and are never overwritten by defaults.
- Fixed a recognition restart loop and the push-to-talk mode reset. Where continuous listening is unsupported (iOS/iPadOS), the recognizer runs single-utterance and LifeOS restarts it after each phrase. The error alert clears on recovery (**Try again**).
- Duplicate-turn protection (in-flight guard + identical-transcript window). A visible provider/fallback indicator. Capability and privacy notes before the microphone starts.
- `concise` response style shortens the spoken reply deterministically. Primary voice controls are ≥ 44 px.

### Fixed — widgets and game loop (#42)

- A per-widget error boundary plus `app/error.tsx` and `app/global-error.tsx`, so one failing widget no longer takes down the page. Browser storage failures surface a diagnostic instead of throwing.
- **Repair layout** now removes unknown/duplicate ids, restores missing widgets, clears stale focus, and lists what it fixed. If the browser refuses to save, it says so instead of claiming success. Mobile reorder skips hidden widgets.
- **Reset game** and **Restore default layout** ask first. The game keeps a backup of the previous state.
- Streak recovery restores the pre-gap streak. Boss battles require every step before they can be claimed. A boss saved without steps is never claimable, and repair rebuilds its steps.
- Side quests (health, learning, money, relationships, service, personal growth) are derived only from canonical vault records.
- Reward/level-up/achievement announcements. An end-of-day results panel. A read-only **LifeOS Game** card on `/today`.
- E2E: real resize, drag-persistence, hide-after-reload, repair, mobile-order, console-error, XP-exactly-once (double-click + reload), level-up, and achievement-once checks.

### Fixed — Resource Intelligence

- The intake re-fetches GitHub evidence server-side at write time and writes a `## Source Evidence` section plus `evidence_status`/`evidence_inspected_at`.
- Records get a deterministic `processor_route` per source type, pointing only at existing processors, SOPs, or templates.
- Repeated captures before merge find the record's open intake draft PR by branch prefix and update it, instead of opening competing PRs. Each request stages on its own branch; no branch is ever force-moved, so simultaneous captures cannot overwrite each other.
- Upstream read failures return a clean 502. `99 Templates/Resource.md` matches the record contract.

### Fixed — platform

- The vault frontmatter parser reads YAML block lists (`tags:` + `- item`), restoring tags for about 59 notes and all Resource records.
- Added `app/icon.svg`: the first page load no longer logs a favicon 404 console error.
- Dashboard CI job and browser steps have timeouts, so a hung browser download fails fast.

### Included from `main`

- PR #74 (MAPS operating layer) merged first as `62a9df9`:
  - the master router and seven signposts
  - the Pulse routine registry
  - `scripts/validate-maps.ps1`
  - the daily MAPS Integrity workflow

### Documentation

- `80 SOPs/LifeOS Owner's Operating Manual.md` v2.0 is a complete step-by-step owner/operator guide.
- `docs/OWNER_ACCEPTANCE_WORKBOOK.md` is refreshed for voice, Resource Intelligence, and MAPS.
- Canonical status, deployment guide, and vault repair report are reconciled.

## [Unreleased] — post-#60 security corrective (draft PR)

### Security

- `POST /api/lifeos/agent/approval` requires `LIFEOS_WRITE_ENABLED` and `LIFEOS_WRITE_SECRET`. Voice-session tokens and anonymous callers cannot approve or execute external actions
- Approvals and nonces use shared durable storage (Upstash Redis REST). Missing storage fails closed. Production does not fall back to process-local Maps
- Approved Slack, ClickUp, n8n, and Vercel adapters execute the stored owner-reviewed arguments, not the approval summary
- `POST /api/lifeos/voice/speak` validates origin, requires owner/TTS authorization, limits text to 2000 characters, uses a trusted rate-limit identity, and returns sanitized errors
- Explicit `provider: "browser"` returns the browser-fallback response immediately and does not call OpenAI
- Updated Next.js, Vitest, js-yaml, and Sharp dependency resolutions to remediate published critical, high, and moderate advisories

### Fixed

- End-of-day check-in XP is counted once when the daily check-in quest is already complete
- Screen-share requesting state is applied to the visible conversation UI before grant or deny

### Performance

- Vault Markdown parsing uses bounded concurrency while preserving deterministic index order
- Workspace drag and resize operations persist layout only when interaction ends, avoiding per-frame storage writes and dashboard-wide updates
- Filesystem idempotency claims use asynchronous I/O and throttle TTL directory sweeps
- The optional voice console and its state-machine dependencies load after the dashboard becomes idle

### Documentation

- Owner workbook, agent runtime, voice architecture, deployment, and canonical live status updated for the corrective. Owner acceptance remains required.

## Operational closeout (merged to main via PR #60)

### Added

- Owner acceptance workbook (`docs/OWNER_ACCEPTANCE_WORKBOOK.md`)
- Server-authoritative agent approvals (expiry, nonce/replay, session/project/repository binding, path allowlist, revision binding)
- Conversation mute that aborts recognition capture; screen-share generation + unmount cleanup
- Distinct voice `permission-denied` state
- Game quest completion requires owner attestation; XP progress bar and profile controls
- Boss battles decompose real blockers into smaller actions (steps never award XP)
- Daily check-in button and daily quest share one XP event
- Mobile widget chrome (reorder / minimize / hide) at 390px
- Integration availability states (`available` / `configured` / `unavailable`) with missing requirements
- Playwright projects for 1440 / 1024 / 390 viewports plus drag/resize/mute journeys
- Hold-to-talk conversation control; new speech stops overlapping TTS
- Push-to-talk release returns the visible voice state to idle and keeps PTT mode (does not leave a listening mic UI)
- Command-palette Repair layout; accessible Move up/down swaps grid geometry
- Daily check-in quest bound to the top-priority project next action
- `github.inspect_health` read executor that does not invent CI counts
- Dashboard CI typecheck step

### Security

- Browser Approve UI alone cannot authorize tool execution
- Wrong-project, replayed, expired, path-allowlist, and revision-binding mismatches are rejected server-side

## [1.0.0] — 2026-07-28

### Added

- **Workspace OS V1** — draggable/resizable Command Center widgets, command palette, browser-local layout persistence
- **Interactive Operations V2** — conflict-safe authenticated change-plan persistence (draft PR only, default-deny writes)
- **Interactive Visual System V1** — accessible dnd-kit Command Board, React Flow Command Map, motion primitives with reduced-motion support
- **Verbal + Audio V1** — optional browser speech console (push-to-talk), HMAC session tokens, voice staging wired into the Command Board

### Security

- Voice session tokens are HMAC-signed with expiry (when `LIFEOS_VOICE_SESSION_SECRET` is set)
- `LIFEOS_VOICE_ENABLED` must be `true` to enable the voice console
- LiveKit is not advertised as a ready provider in V1 (room-token minting deferred)
- Change-plan writes remain default-deny (`LIFEOS_WRITE_ENABLED=false`)

### Changed

- Dashboard package version bumped to `1.0.0`
- Removed unused `@rive-app/react-canvas` and `livekit-client` runtime dependencies
- Pinned previously caret-ranged dashboard dependencies for reproducible builds
- Vitest default timeout raised for Windows vault filesystem scans

### Documentation

- Added deployment guide, release notes, and this changelog
- Updated voice/visual architecture notes for production V1 boundaries

### Release

- Merged via PR #40 onto `main` (`ef21fa1`)
- Superseded stacked PRs #38 and #39 closed without merge
- Production domain: `https://lifeos-enterprise.vercel.app`
