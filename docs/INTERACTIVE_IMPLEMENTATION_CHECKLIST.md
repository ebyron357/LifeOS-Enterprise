# LifeOS Interactive Implementation Checklist

**Companion:** `docs/INTERACTIVE_VISUAL_VOICE_ARCHITECTURE.md`  
**Visual V1 branch:** `feat/lifeos-interactive-visual-v1`  
**Foundation tip included:** `8e2006b`  
**Hard rules:** No direct `main` writes · no auto-merge · no Supabase/DB · no client secrets · preserve accessibility · professional AI command-center tone.

---

## Phase 0 — Repository integrity

- [x] Confirm production `main` tip (`ae23a0b`).
- [x] Confirm foundation branch exists and was **not** merged.
- [x] Continue from foundation tip for Visual V1.
- [ ] Integrate Interactive Operations V2 (`1a00287`) before production write enablement.
- [x] Update `docs/THIRD_PARTY.md` for new runtime dependencies.

---

## Phase 1: Motion and interaction foundation

- [x] Keep / deepen `motion` via reusable primitives (`components/motion/*`, `lib/motion/*`).
- [x] Respect OS reduced-motion, LifeOS toggle, overload mode.
- [x] Subtle springs only; no blocking / playful motion.
- [x] Upgrade board DnD with `@dnd-kit/*` (keyboard + touch + overlay + announcements).
- [x] Preserve staging / approval / draft-PR governance.
- [x] Centralized interaction feedback (staged ≠ saved).
- [x] Lint / typecheck / test / build green on Visual V1 tip.

---

## Phase 2: Interactive command map

- [x] Install `@xyflow/react@12.11.2`.
- [x] Real vault-derived graph (`lib/command-map/build-command-map.ts`).
- [x] Toolbar: search, entity/status/project filters, focus mode, fit/reset.
- [x] Details panel + legend + keyboard list + mobile fallback.
- [x] No editing/connect controls.
- [x] Board ↔ Map switch in OperationsSurface.
- [x] Tests for graph integrity / filters / empty warning.

---

## Phase 3: Voice and audio console

- [ ] Deferred (no audio in Visual V1).

---

## Phase 4: Animated command presence

- [ ] Deferred (Rive not installed).

---

## Phase 5: Accessibility and quality validation

- [x] Keyboard sensors / selects / focus-visible styles.
- [x] Reduced-motion preference tests.
- [x] Non-color map signals (shape + label + status text).
- [x] Overload/motion coupling.
- [ ] Broader assistive-tech manual pass on preview deployment.

---

## Phase 6: Production configuration

- [ ] Draft PR opened for Visual V1 (do not merge until reviewed).
- [ ] V2 persistence integration still required before write activation.
- [ ] No database introduced.

---

## Exact next implementation step

1. Review/merge Visual V1 draft PR after human approval (or iterate on preview feedback).  
2. Integrate Interactive Operations V2 into this line.  
3. Begin Phase 3 voice console only after Visual V1 is accepted.
