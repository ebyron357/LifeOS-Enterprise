# Changelog

All notable changes to LifeOS Enterprise are documented in this file.

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
