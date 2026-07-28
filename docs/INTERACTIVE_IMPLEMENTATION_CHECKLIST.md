# LifeOS Interactive Implementation Checklist

**Companion:** `docs/INTERACTIVE_VISUAL_VOICE_ARCHITECTURE.md`  
**Foundation branch:** `feat/lifeos-interactive-voice-foundation`  
**Base commit:** `faa6897d2447f264ea269e54793e340153395ea9`  
**Constraint:** Do not implement the full feature set in the foundation commit. Check items off as phases ship on this branch (or successor PRs).  
**Hard rules:** No direct `main` writes · no auto-merge of open PRs · no Supabase/DB · no client secrets · preserve accessibility and cognitive supports · keep professional AI command-center tone.

---

## Phase 0 — Repository integrity (before feature phases)

- [x] Confirm production `main` tip (`ae23a0b` Interactive Operations V1).
- [x] Confirm newest interactive tip (`feature/workspace-os-v1` @ `faa6897`, PR #37).
- [x] Confirm persistence tip (`agent/interactive-operations-v2` @ `1a00287`, PR #36) is diverged and must not be discarded.
- [x] Create `feat/lifeos-interactive-voice-foundation` from `faa6897`.
- [x] Publish architecture + this checklist.
- [ ] Integrate Interactive Operations V2 change-plan hardening into this line (cherry-pick or deliberate merge commit) **before** enabling production writes.
- [ ] Re-run Dashboard CI + Vault Health on the integration commit.
- [ ] Update `docs/THIRD_PARTY.md` whenever a new runtime dependency is added.

---

## Phase 1: Motion and interaction foundation

**Goal:** Deepen calm, professional motion and interaction on the **existing** Workspace OS + command board without redesigning the product.

### Dependencies

- [ ] **Keep** installed `motion@^12.42.2` (already on foundation tip).
- [ ] **Do not install** xyflow / dnd-kit / Rive / LiveKit / XState / ElevenLabs / wavesurfer in this phase.
- [ ] Document any new motion utilities in `docs/THIRD_PARTY.md` only if packages change (expected: none).

### Work items

- [ ] Audit all `motion` usages; ensure `"use client"` boundaries stay narrow.
- [ ] Wire reduced-motion + overload mode to disable non-essential transitions (`data-lifeos-reduced-motion`, `prefers-reduced-motion`, `data-lifeos-overloaded`).
- [ ] Add subtle enter/focus transitions for widget chrome only — no bounce, confetti, or game juice.
- [ ] Preserve native HTML5 project-board DnD and accessible `<select>` status controls.
- [ ] Preserve react-grid-layout drag handles as labeled controls (not drag-only).
- [ ] Confirm Quick Capture, Morning Brief speak, and cognitive resume notes still work.
- [ ] Confirm change-plan staging + approval package generation unchanged.

### Validation gates

- [ ] `npm ci`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test` (including `tests/workspace-os.test.tsx`, `tests/interactive-command-center.test.tsx`)
- [ ] `npm run build`
- [ ] Manual: reduced-motion toggle + OS reduced-motion both kill decorative animation
- [ ] Manual: overload mode still hides non-essential widgets

### Exit criteria

- [ ] No new heavy dependencies.
- [ ] No regressions to board staging or Workspace OS layout persistence.
- [ ] Motion feels operational, not playful.

---

## Phase 2: Interactive command map

**Goal:** Optional graph/map surface for operations relationships — secondary to the command board, not a replacement.

### Dependencies

- [ ] Evaluate then install `@xyflow/react` (MIT) only when implementation starts.
- [ ] Record version + license in `docs/THIRD_PARTY.md`.
- [ ] Dynamic-import / client-only boundary; measure bundle impact in `next build`.
- [ ] **Reject** replacing Workspace OS grid or project board with xyflow.

### Work items

- [ ] Add `components/map/*` (or equivalent) behind an explicit Command Center entry point.
- [ ] Feed nodes/edges from existing vault-derived props (projects, agents, blockers) — no DB.
- [ ] Provide keyboard / list fallback identical in meaning to the canvas.
- [ ] Honor reduced-motion (limit pan/zoom animation) and overload mode (hide or simplify map).
- [ ] Mobile: stack or collapse map; prevent horizontal overflow at 390px.

### Validation gates

- [ ] Unit tests for data→graph mapping
- [ ] Keyboard path test (no canvas-only actions)
- [ ] Lint / typecheck / test / build green
- [ ] Bundle note in PR body (before vs after)

### Exit criteria

- [ ] Map is optional, professional, and accessibility-complete.
- [ ] Board + change-plan workflow remain primary mutation UX.

---

## Phase 3: Voice and audio console

**Goal:** Professional voice console that extends existing Web Speech briefing — not a demo agent toy.

### Dependencies (staged)

- [ ] **Tier 1 (default):** keep `speechSynthesis` + `buildMorningBriefSpeech` — no new package.
- [ ] **Tier 2 (optional):** ElevenLabs SDK **server-mediated** only — deferred until keys + fallback exist.
- [ ] **Tier 3 (optional):** LiveKit (`livekit-client`, `@livekit/components-react`) and/or OpenAI Realtime — **reference first**; install only after transport choice documented.
- [ ] XState (`xstate` + `@xstate/react`) — install only if session state exceeds maintainable `useState`.
- [ ] wavesurfer.js — optional decorative waveform; never the only status indicator.
- [ ] **Do not** vendor `livekit-examples/agent-starter-react` or `openai/openai-realtime-agents` wholesale.

### Work items

- [ ] Create `components/voice/*` console: speak brief, stop, captions, permission states.
- [ ] Reuse `lib/lifeos/morning-brief-speech.ts` text as caption source of truth.
- [ ] Add explicit mic gesture + visible listening state for any inbound STT.
- [ ] Route any vault-mutating voice intent into existing staged change-plan review (no speak-to-main).
- [ ] Server route for short-lived tokens (if realtime) — secrets never in client bundle.
- [ ] Error copy for permission denied / unsupported / network failure.
- [ ] Respect overload mode (shorter spoken script) and reduced-motion (static audio affordances).

### Security checklist

- [ ] No API keys in client
- [ ] No audio/transcript secrets in git
- [ ] Origin checks + rate limits on token routes
- [ ] Audit logs without raw audio payloads

### Validation gates

- [ ] Tests for speech text builder + console state transitions
- [ ] Test asserting client bundle / source has no vendor API key patterns for new routes
- [ ] Lint / typecheck / test / build
- [ ] Manual: captions match spoken text; Stop cancels speech

### Exit criteria

- [ ] Web Speech path works offline-ish without vendor keys.
- [ ] Realtime path (if present) is env-gated and preview-safe.
- [ ] Vault write safety model unchanged.

---

## Phase 4: Animated command presence

**Goal:** Subtle operational presence indicator — never game avatar / mascot energy.

### Dependencies

- [ ] Install `@rive-app/react-canvas` only with approved `.riv` asset and static PNG/SVG fallback.
- [ ] Update `docs/THIRD_PARTY.md`.

### Work items

- [ ] Mount presence only in a dedicated chrome slot (e.g., command status), not on every widget.
- [ ] Unmount or freeze under reduced-motion, overload, and `prefers-reduced-motion`.
- [ ] Keep CPU/GPU cost low; no looping spectacle.
- [ ] Ensure decorative animation is `aria-hidden` with adjacent text status.

### Validation gates

- [ ] Unit test: presence disabled when reduced-motion / overload flags set
- [ ] Lint / typecheck / test / build
- [ ] Design review: “professional ops” vs “game/toy” checklist pass

### Exit criteria

- [ ] Presence improves situational awareness without increasing cognitive load.

---

## Phase 5: Accessibility and quality validation

**Goal:** Prove the upgrade remains usable under cognitive load and assistive tech.

### Work items

- [ ] Keyboard-only pass: board, palette (`Ctrl/⌘K`), persistence, voice console, map fallback.
- [ ] Screen-reader pass: live regions, headings, widget labels, captions.
- [ ] Contrast / large-text / calm-density / overload regression pass.
- [ ] Mobile 390px overflow pass (Workspace OS standard).
- [ ] Confirm README/docs notes never appear in operational tables (vault rules).
- [ ] Confirm private / `publish: false` notes remain excluded from portal.

### Validation gates

- [ ] Full `npm ci` / lint / typecheck / test / build
- [ ] Dashboard CI + Vault Health green on PR
- [ ] Manual a11y checklist attached to PR

### Exit criteria

- [ ] No accessibility regression vs Workspace OS V1 + Interactive Operations V1 baseline.

---

## Phase 6: Production configuration

**Goal:** Safe activation documentation — not silent production enablement.

### Work items

- [ ] Document required env vars (existing write vars + any voice vars) without committing values.
- [ ] Confirm Vercel preview vs production promotion steps.
- [ ] Ensure write path remains default-deny until explicitly enabled.
- [ ] Integrate / merge V2 persistence controls if not done in Phase 0.
- [ ] Final `docs/THIRD_PARTY.md` sync.
- [ ] Rollback notes verified (revert PR / redeploy previous Vercel deployment).
- [ ] Explicit statement: no database introduced; GitHub Markdown remains SoT.

### Validation gates

- [ ] CI green on release PR
- [ ] Production deploy only after human approval (no auto-merge from agents)
- [ ] Post-deploy smoke: dashboard load, speak brief, stage change (no write unless enabled)

### Exit criteria

- [ ] Production remains professional AI command center with verified safety model.

---

## Exact next implementation step

1. On `feat/lifeos-interactive-voice-foundation`, integrate `agent/interactive-operations-v2` (`1a00287`) via an explicit merge/cherry-pick commit (do not merge PRs to `main` yet).  
2. Re-run lint / typecheck / test / build.  
3. Begin **Phase 1** motion hardening against reduced-motion + overload — still with **no new packages**.
