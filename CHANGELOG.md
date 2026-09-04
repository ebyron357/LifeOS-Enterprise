# Changelog

All notable changes to LifeOS Enterprise are documented in this file.

## [Unreleased] — operational closeout (draft PR)

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
