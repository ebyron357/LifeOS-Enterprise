# LifeOS Interactive Implementation Checklist

**Companion docs:** `docs/INTERACTIVE_VISUAL_VOICE_ARCHITECTURE.md`, `docs/VOICE_ARCHITECTURE.md`  
**Verbal V1 branch:** `feat/lifeos-verbal-audio-v1`  
**Started from Visual V1 tip:** `646e67c` (PR #38 still draft / unmerged)  
**Hard rules:** No direct `main` writes · no auto-merge · no Supabase/DB · no client secrets · voice optional · professional AI command-center tone.

---

## Phase 0 — Repository integrity

- [x] Inspected `main` (`ae23a0b`).
- [x] Confirmed Interactive Visual System V1 PR #38 is **not merged** (still draft).
- [x] Continued from newest interactive tip `feat/lifeos-interactive-visual-v1` @ `646e67c`.
- [ ] Integrate Interactive Operations V2 before production write enablement.
- [x] Update third-party attribution for voice deps.

---

## Phase 1–2 — Visual foundation

- [x] Completed on Visual V1 branch (motion, dnd-kit, command map).

---

## Phase 3 — Voice and audio console

- [x] XState voice state machine with required states/transitions.
- [x] Provider abstraction (`browser` default, LiveKit stub).
- [x] Voice console UI: controls, transcript, status, confirmation, settings, visualizer, presence.
- [x] Push-to-talk only (no wake word).
- [x] Read-only commands against real vault data.
- [x] Write commands require confirmation + staging governance.
- [x] Session + tools API routes (no permanent keys to client).
- [x] Locale fields prepared for en/ht/fr (English verified only).
- [x] Safe degrade without credentials.
- [x] Tests for machine, commands, tools, security, transcripts.

---

## Phase 4 — Animated command presence

- [x] CSS abstract presence responsive to voice states.
- [x] Optional Rive loader installed; no proprietary asset required.
- [x] Listening indicator never active when mic inactive.

---

## Phase 5 — Accessibility / quality

- [x] Keyboard shortcuts, transcripts, optional audio.
- [x] Lint / typecheck / unit tests.
- [ ] Preview CI + broader assistive-tech pass.

---

## Phase 6 — Production configuration

- [x] `.env.example` placeholders for voice providers.
- [ ] Owner supplies LiveKit/OpenAI/ElevenLabs credentials for realtime verification.
- [ ] Draft PR opened (do not merge until reviewed).

---

## Exact next production step

1. Open/review Verbal Audio V1 draft PR.  
2. Supply preview env credentials if LiveKit realtime validation is required.  
3. Integrate Interactive Ops V2 before enabling write staging in production.  
4. Merge Visual V1 + Verbal V1 only after human approval (no auto-merge).
