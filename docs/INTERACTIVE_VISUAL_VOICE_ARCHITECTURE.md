# LifeOS Interactive Visual + Voice Architecture

**Status:** Foundation planning only (no full feature implementation in this document’s landing commit)  
**Date:** 2026-07-27  
**Repository:** `ebyron357/LifeOS-Enterprise`  
**Foundation branch:** `feat/lifeos-interactive-voice-foundation`  
**Base commit:** `faa6897d2447f264ea269e54793e340153395ea9` (`feature/workspace-os-v1` tip)  
**Production `main`:** `ae23a0b459b81e9c2405fa75736bd2f22b8240e1` (Interactive Operations V1 merge)

---

## 1. Verified source of truth

### Evidence collected

| Source | Commit / tip | CI | Notes |
|--------|--------------|----|-------|
| Production default branch `main` | `ae23a0b` | Dashboard CI + Vault Health green on merge of PR #35 | Interactive Operations V1 is live |
| Open PR #37 `feature/workspace-os-v1` | `faa6897` | Dashboard CI, Vault Health, Vercel SUCCESS | Newest interactive UI; already adopts `motion`, `react-grid-layout`, `cmdk` |
| Open PR #36 `agent/interactive-operations-v2` | `1a00287` | Dashboard CI, Vault Health, Vercel SUCCESS | Conflict-safe change-plan persistence; **diverges** from Workspace OS |
| Stale local zip `LifeOS-Enterprise-main` | not a git repo | n/a | Missing portal markdown stack + Workspace OS; **must not** be treated as SoT |

### Decision

1. **Production source of truth:** GitHub `main` @ `ae23a0b`.
2. **Newest verified interactive application tip (foundation base):** `feature/workspace-os-v1` @ `faa6897`.
3. **Newest verified persistence tip (must not be lost):** `agent/interactive-operations-v2` @ `1a00287`.
4. **This foundation branch** starts from (2) and documents (3) as a required pre-merge integration. Neither open PR is auto-merged.

`feature/workspace-os-v1` and `agent/interactive-operations-v2` both branch from `ae23a0b` and are **diverged** (`ahead 3 / behind 5` vs each other). Combining them requires an explicit integration PR later — not a silent overwrite.

### Runtime stack (verified from `package.json` on foundation base)

| Component | Version |
|-----------|---------|
| Next.js | `16.1.6` |
| React / React DOM | `19.2.4` |
| TypeScript | `5.9.3` |
| Vitest | `4.0.18` |
| Node (CI) | `22` (`.github/workflows/dashboard-ci.yml`) |
| Already present interactive deps | `motion@^12.42.2`, `react-grid-layout@^2.2.3`, `cmdk@^1.1.1` |

---

## 2. Current-state architecture

```text
Obsidian Markdown vault (GitHub canonical)
        │
        ▼
lib/vault/* + lib/lifeos/vault-data.ts   (server loaders)
        │
        ▼
app/* portal routes (read-mostly Next.js App Router)
        │
        ▼
app/dashboard/page.tsx
        │
        ▼
DashboardLayout + PortalSidebar
        │
        ▼
CommandCenterWorkspace                 (Workspace OS V1)
  ├─ WorkspaceProvider                 (localStorage layout schema v2)
  ├─ WorkspaceShell                    (palette, reduced-motion, switcher)
  └─ WorkspaceGrid (react-grid-layout)
       └─ existing widgets / InteractiveCommandCenter / ChangePlanPersistence

Authenticated writes (optional, default-deny):
  browser approval package
    → POST /api/lifeos/change-plan
    → isolated branch + draft PR against main
    → never direct main write
```

### Feature inventory (code-backed)

| Capability | Status on foundation base | Primary evidence |
|------------|---------------------------|------------------|
| Dashboard layout | **Present** — Workspace OS Command Center hosts widgets | `components/workspace/*`, `docs/WORKSPACE_OS_V1.md` |
| Project interaction | **Present** — board, filters, modes, expand/edit | `components/dashboard/InteractiveCommandCenter.tsx` |
| Drag and drop | **Present** — native HTML5 DnD for project lanes; RGL for widget chrome | InteractiveCommandCenter + WorkspaceGrid |
| Project editing | **Present** — status / priority / next_action drafts | InteractiveCommandCenter |
| Change staging | **Present** — browser-only draft map + review panel | InteractiveCommandCenter |
| Approval packages | **Present** — `lifeos.change-plan.v1` JSON | InteractiveCommandCenter |
| GitHub draft PRs | **Present (V1)** on this tip; **V2 hardening open on PR #36** | `app/api/lifeos/change-plan/route.ts`, `ChangePlanPersistence.tsx`, `docs/INTERACTIVE_OPERATIONS_V1.md` / V2 branch docs |
| Morning brief | **Present** — live vault priorities widget | `components/widgets/MorningBrief.tsx` |
| Spoken briefing | **Present** — Web Speech API (`speechSynthesis`) | `lib/lifeos/morning-brief-speech.ts`, `DashboardQuickActions.tsx` |
| Cognitive support | **Present** — Now/Next/Later + resume notes | `components/dashboard/CognitiveSupportCenter.tsx` |
| Overload mode | **Present** — hides non-essential widgets via `data-lifeos-overloaded` | CognitiveSupportCenter + `app/globals.css` |
| Display density | **Present** — calm / standard | CognitiveSupportCenter (`data-lifeos-density`) |
| Reduced motion | **Present** — OS preference + toolbar toggle + workspace storage | WorkspaceShell, globals.css, layout-storage |
| High contrast | **Present** — toggle → `data-lifeos-contrast` | CognitiveSupportCenter |
| Large text | **Present** — normal / large → `data-lifeos-text` | CognitiveSupportCenter |
| Browser-local storage | **Present** — SSR-safe `useSyncExternalStore` helpers + workspace layout key | `lib/lifeos/use-browser-storage.ts`, `lib/workspace/layout-storage.ts` |
| Project + agent data | **Present** — vault loaders + AI workforce widget | `lib/lifeos/vault-data.ts`, `components/widgets/AIStatus.tsx` |
| Authentication | **Server write secret + GitHub token**; no end-user IdP yet | change-plan route env gate |
| Deployment | **Vercel** project `tradeiq/lifeos-enterprise`; no `vercel.json` in repo | PR checks + Vercel status contexts |

Product posture already enforced in docs and UI copy: professional AI command center — not a game, not a toy dashboard.

---

## 3. Target-state architecture

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Client (professional AI operations console)                          │
│  Workspace OS shell                                                  │
│   ├─ Motion layer (already installed; expand carefully)              │
│   ├─ Interaction layer (board DnD; optional dnd-kit later)           │
│   ├─ Command map (xyflow — Phase 2, optional surface)                │
│   ├─ Voice/audio console (Web Speech → later LiveKit/realtime)       │
│   └─ Animated presence (Rive — Phase 4, reduced-motion gated)        │
│                                                                      │
│  Accessibility / cognitive overlays (existing, preserved)            │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS only
┌───────────────────────────────▼──────────────────────────────────────┐
│ Next.js server                                                       │
│  Vault readers (unchanged)                                           │
│  Change-plan API (integrate V2 before production write enablement)   │
│  Future voice token minting (short-lived, server-only secrets)       │
│  No Supabase / no new database in this program                       │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│ GitHub + Obsidian Markdown = canonical SoT                           │
│ Draft-branch / PR workflow preserved                                 │
└──────────────────────────────────────────────────────────────────────┘
```

Target qualities: highly interactive, visually responsive, voice- and audio-enabled, accessible, calm under overload, professional, high-speed AI ops.

---

## 4. Repository decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Working tree | Clone of GitHub repo (not the stale zip) | Zip lacked git history and newer portal/Workspace OS work |
| Foundation base | `faa6897` Workspace OS V1 | Newest green interactive tip; already includes `motion` |
| Persistence | Keep PR #36 open; integrate before enabling writes | V2 conflict safety must not be overwritten by Workspace OS |
| `main` | Untouched by this foundation work | Operating rule: no direct main writes / no auto-merge |
| Database | None this phase | Explicit program constraint |
| Secrets | Server env only | Never commit tokens / private URLs |

---

## 5. Dependency decision matrix

Stack constraint for all decisions: **Next.js 16.1.6 + React 19.2.4 + Node 22 (CI)**. No large dependency may be added without updating `docs/THIRD_PARTY.md` and this matrix.

| Candidate | Intended role | Decision | React 19 | Next 16 | Bundle | License | A11y | Server/client | Deploy | Duplicates existing? |
|-----------|---------------|----------|----------|---------|--------|---------|------|---------------|--------|----------------------|
| `motiondivision/motion` (`motion`) | Panel / layout transitions; calm visual response | **Already installed — keep / deepen in Phase 1** | Peer `^18 \|\| ^19` (npm `12.42.2`) | Client components only | ~0.7 MB unpacked | MIT | Must honor reduced-motion | `"use client"` only | No infra | Already in Workspace OS |
| `xyflow/xyflow` (`@xyflow/react`) | Interactive command / operations map | **Deferred to Phase 2** (install only when map ships) | Peer `>=17`; use current 12.x | Client-only; prefer dynamic import | ~1.2 MB unpacked | MIT | Provide non-canvas keyboard path | Client canvas; data from server props | No infra | Partial overlap with board + RGL — use for **graph map**, not widget layout |
| `clauderic/dnd-kit` (`@dnd-kit/*`) | Accessible project-board DnD upgrade | **Deferred** until native HTML5 DnD proves insufficient | Peer React `>=16.8` | Client-only | ~1.0 MB core unpacked | MIT | Strong keyboard a11y story | Client | No infra | Overlaps native board DnD + RGL; do **not** replace RGL |
| `statelyai/xstate` (+ `@xstate/react`) | Voice/session/interaction state machines | **Deferred to Phase 3** for voice console state | `@xstate/react` peers React 19 | Framework-agnostic | ~2.3 MB unpacked | MIT | Helps deterministic a11y states | Machines can be shared; IO adapters client/server split | No infra | Overlaps ad-hoc `useState` machines — adopt only for complex voice session graphs |
| `rive-app/rive-react` (`@rive-app/react-canvas`) | Subtle animated command presence | **Deferred to Phase 4** | Peer includes `^19.0` | Client-only | Runtime small; assets separate | MIT | **Mandatory** reduced-motion / static fallback | Client; assets in `/public` or CDN | Asset caching | None today — gate hard so it never feels game-like |
| `livekit/agents-js` (`@livekit/agents`) | Realtime voice agent runtime | **Deferred / reference** — Phase 3+ only with infra plan | N/A (server agents) | Separate Node agent process typical | Heavy; not a Next page dep | Apache-2.0 | Caption + text fallback required | **Server/agent host**, not browser bundle | Needs LiveKit Cloud or self-host + keys | Does not replace Web Speech briefing |
| `livekit-examples/agent-starter-react` | Reference UI patterns | **Reference only — do not vendor wholesale** | Example-dependent | Example-dependent | n/a | Example licenses vary | Copy patterns, not chrome | Follow LiveKit token model | Preview envs need keys | Would conflict with LifeOS shell if imported whole |
| `openai/openai-realtime-agents` | Reference realtime agent patterns | **Reference only** | Example-dependent | Example-dependent | n/a | Example / OpenAI terms | Same caption/text rules | Secrets server-side | OpenAI + possibly WebRTC | Overlaps LiveKit path — pick **one** realtime transport later |
| `elevenlabs/packages` (`elevenlabs` / `@elevenlabs/client`) | TTS upgrade beyond browser voices | **Deferred** — optional Phase 3/6 | Client SDK MIT | API keys **server-only** | Moderate | MIT (SDK); service ToS separate | Always keep Web Speech fallback | Browser plays audio; synthesis via server or signed URLs | Needs `ELEVENLABS_API_KEY` | Overlaps `speechSynthesis` — enhancement, not replacement |
| `katspaugh/wavesurfer.js` | Waveform visualization for briefings | **Deferred** — optional Phase 3 visual | No React peer (vanilla) | Client wrapper | ~1.4 MB unpacked | BSD-3-Clause | Decorative only; not sole affordance | Client | No infra | None; keep subtle |

### Install now (this foundation phase)

**None.** Dependencies already on the foundation tip are sufficient for Phase 1 planning. Do not add LiveKit, Rive, xyflow, dnd-kit, XState, ElevenLabs, or wavesurfer until their phase checklist gates pass.

### Rejected for this program (or permanently for default UX)

| Item | Reason |
|------|--------|
| Supabase / new DB | Explicit phase constraint; GitHub Markdown remains SoT |
| Wholesale import of starter kits | Would replace LifeOS professional shell with demo chrome |
| Game-like or novelty animation stacks as default | Violates calm / professional command-center brief |
| Client-bundled API keys for any voice vendor | Security boundary violation |

---

## 6. Component boundaries

| Boundary | Owns | Must not own |
|----------|------|--------------|
| `components/workspace/*` | Layout chrome, palette, grid persistence | Vault mutation, voice transport secrets |
| `components/dashboard/InteractiveCommandCenter*` | Project board staging UX | Direct GitHub writes |
| `components/dashboard/ChangePlanPersistence*` | Authenticated submit UX | Token storage in localStorage |
| `components/dashboard/CognitiveSupportCenter*` | Overload / density / contrast / large text | Decorative animation that fights overload mode |
| `components/widgets/*` | Read-mostly operational widgets | Layout persistence schema |
| Future `components/voice/*` | Mic/TTS UI, captions, transport adapters | Markdown writes; layout grid |
| Future `components/map/*` | xyflow command map | Replacing Workspace OS grid |
| `lib/lifeos/*` | Domain helpers, browser storage, brief speech text | Network credentials |
| `lib/workspace/*` | Workspace registry + layout schema | Project frontmatter edits |
| `app/api/lifeos/*` | Server-side GitHub persistence + future token mint | Client-trusted authorization |

---

## 7. Server / client boundaries

- **Server Components / loaders:** vault index, project briefs, GitHub health, revenue fetch — no browser secrets.
- **Client Components:** all interactive, motion, DnD, speech, mic, canvas, localStorage.
- **Route handlers:** change-plan (and future voice token) — env secrets, allowlists, audit.
- **Never** import `motion`, xyflow, Rive, wavesurfer, or LiveKit client into a Server Component file without a client boundary.

---

## 8. Authentication boundaries

Current model (preserve):

- Read portal: no end-user login required for public/non-private vault projection.
- Writes: `LIFEOS_WRITE_ENABLED`, `LIFEOS_WRITE_SECRET`, `LIFEOS_GITHUB_TOKEN` (+ optional `LIFEOS_ALLOWED_ORIGIN` in V2).
- Browser sends short-lived user-entered write secret over HTTPS; GitHub token never leaves the server.

Future voice model:

- Vendor API keys and LiveKit API secrets remain server-only.
- Browser receives **short-lived room/participant tokens** only.
- Voice actions that would mutate vault data must still flow through change-plan staging + draft PR — never “speak to commit on main”.

---

## 9. Voice security model

1. Default: **Web Speech API** for outbound briefing (already shipped) — no vendor key.
2. Inbound voice (future): explicit user gesture to start listening; visible recording state; easy cancel.
3. Transcripts shown in UI; no silent command execution against GitHub.
4. High-risk intents (status changes, PR creation) require the existing visual approval package path.
5. Rate-limit and origin-check token mint endpoints (when added) using the same posture as V2 change-plan.
6. Log structured events without raw audio or secrets.
7. Fail closed when env not configured; UI must say “voice service unavailable” without implying vault writes occurred.

---

## 10. Accessibility model

Preserve and extend:

- Skip link, landmarks, `aria-live` status regions (WorkspaceShell, persistence, board messages).
- Keyboard alternatives for every drag gesture (status `<select>`, palette commands, reset layout).
- Focus-visible styles on shell/widget controls.
- Touch targets ≥ 40px where interactive.
- Captions / visible text for every spoken utterance.
- Screen-reader labels on health lights, agent status, and waveform decoration (decorative `aria-hidden` when redundant).

---

## 11. Reduced-motion model

Priority order:

1. User Workspace OS “reduced motion” toggle (`data-lifeos-reduced-motion` + layout storage).
2. `prefers-reduced-motion: reduce`.
3. Overload mode implies minimal motion (no celebratory / looping presence animation).

When reduced motion is active:

- `motion` transitions become instant or opacity-only with near-zero duration.
- Rive (Phase 4) renders static frame or is unmounted.
- Waveform animations pause; show flat progress instead.
- Board/map still operable — motion is never the only affordance.

---

## 12. Audio fallback strategy

| Tier | Mechanism | When |
|------|-----------|------|
| 0 | Visible morning brief text | Always |
| 1 | `speechSynthesis` via `buildMorningBriefSpeech` | Default speak action |
| 2 | Optional vendor TTS (ElevenLabs etc.) | Only if configured + user preference |
| 3 | Realtime duplex (LiveKit / OpenAI Realtime) | Phase 3+ after security review |

If speech fails: keep text; announce failure in `aria-live`; never block dashboard.

---

## 13. Error-handling strategy

- **Client:** recoverable messages in existing polite live regions; no toast spam.
- **Change-plan:** preserve V1 behavior on this tip; after V2 integration, surface field-level 409 conflicts.
- **Voice:** timeout, permission denied, and network errors each have explicit copy.
- **Integrations** (GitHub health, revenue): keep existing degraded/fallback labels.
- **Never** pretend a vault write succeeded when only local draft state changed.

---

## 14. Testing strategy

Existing gates (must remain green):

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

CI: `.github/workflows/dashboard-ci.yml` (Node 22) + `vault-health.yml`.

Add per phase:

- Phase 1: motion respects reduced-motion; no regression in workspace-os tests.
- Phase 2: map keyboard path + mobile fallback tests.
- Phase 3: speech text builder + mocked transport; no secret leakage tests.
- Phase 4: Rive unmounts under reduced-motion / overload.
- Phase 5: axe/keyboard checklist; overload density contrast text.
- Phase 6: env-gated activation docs; preview-only secrets.

---

## 15. Phased implementation plan

See `docs/INTERACTIVE_IMPLEMENTATION_CHECKLIST.md`.

Summary:

0. **Pre-req:** Integrate Interactive Operations V2 into this line (or merge both PRs deliberately) before production write enablement.  
1. Motion + interaction foundation on existing Workspace OS.  
2. Optional interactive command map (`@xyflow/react`).  
3. Voice/audio console (Web Speech first; realtime later).  
4. Animated command presence (Rive, gated).  
5. Accessibility + quality validation.  
6. Production configuration (env, docs, THIRD_PARTY, no DB).

---

## 16. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Diverged PR #36 vs #37 | High | Explicit integration commit/PR; do not merge one over the other blindly |
| Stale zip used as SoT | High | Use cloned git repo only |
| Bundle bloat from LiveKit/Rive/xyflow | Medium | Phase gates; dynamic import; measure `next build` |
| Voice keys in client | Critical | Server token mint only |
| Game-like UX drift | High | Design review checklist; overload + reduced-motion gates |
| Native DnD vs dnd-kit rewrite | Medium | Defer dnd-kit; keep selects |
| Serverless rate-limit (V2) | Medium | Documented; shared store before multi-user |
| Local Node 24 vs CI Node 22 | Low | Validate on Node 22 before release claims |

---

## 17. Rollback strategy

1. Leave `feat/lifeos-interactive-voice-foundation` unmerged.  
2. If merged later: revert merge via new PR (no force-push to `main`).  
3. Vercel: redeploy previous production deployment.  
4. Dependency rollback: remove phase packages + lockfile restore from pre-phase commit.  
5. Voice: disable by removing env / feature flag; Web Speech path remains.

---

## 18. Definition of done (foundation phase)

- [x] GitHub history, open PRs, workflows, and package versions inspected with evidence.
- [x] Newest correct interactive tip identified (`faa6897`) without writing to `main`.
- [x] Foundation branch created from that tip.
- [x] This architecture document committed.
- [x] Implementation checklist committed.
- [x] Local `npm ci` / lint / typecheck / test / build recorded (2026-07-27 session on `faa6897` + docs): lint 0, typecheck 0, vitest **56/56**, `next build` success on Next.js 16.1.6.
- [x] No secrets committed; no database added; no full feature implementation claimed complete.

**Program-level DoD** for the interactive/voice upgrade overall remains the completion of Phases 1–6 with green CI and preserved vault/GitHub safety model.
