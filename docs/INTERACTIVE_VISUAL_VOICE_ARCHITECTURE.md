# LifeOS Interactive Visual + Voice Architecture

**Status:** Integrated for LifeOS Enterprise v1.0  
**Date:** 2026-07-28  
**Repository:** `ebyron357/LifeOS-Enterprise`  
**Integration branch:** `release/v1.0-visual-voice-integration`  
**Base:** current `main` (Workspace OS V1 #37 + Interactive Operations V2 #36)

---

## 1. Verified source of truth

| Source | Status | Notes |
|--------|--------|-------|
| Production `main` | Canonical | Includes Workspace OS + Ops V2 persistence |
| Visual V1 | Integrated | Cherry-picked onto latest `main` |
| Verbal V1 | Integrated | Cherry-picked onto Visual tip |
| Interactive Ops V2 | Merged (#36) | Conflict-safe draft-PR persistence; writes remain default-deny |

---

## 2. Current-state architecture (Visual V1)

```text
Vault data (server)
  → DashboardLayout
  → CommandCenterWorkspace (Workspace OS)
       └─ OperationsSurface
            ├─ MotionProvider + InteractionFeedbackProvider
            ├─ Command Board (dnd-kit staging + approval package)
            └─ Command Map (@xyflow/react, dynamic client import)

Writes remain:
  staged browser package → POST /api/lifeos/change-plan → draft PR (never direct main)
```

### New component boundaries

| Area | Paths |
|------|-------|
| Motion primitives | `components/motion/*`, `lib/motion/*` |
| Feedback | `components/feedback/*`, `lib/feedback/types.ts` |
| Command map | `components/command-map/*`, `lib/command-map/*` |
| Operations switch | `components/dashboard/OperationsSurface.tsx` |
| Board | `components/dashboard/InteractiveCommandCenter.tsx` |

### Dependencies added (exact)

| Package | Version | License | Role |
|---------|---------|---------|------|
| `@xyflow/react` | `12.11.2` | MIT | Command map |
| `@dnd-kit/core` | `6.3.1` | MIT | Accessible board DnD |
| `@dnd-kit/sortable` | `10.0.0` | MIT | Sortable helpers |
| `@dnd-kit/utilities` | `3.2.2` | MIT | Transform helpers |
| `motion` | already present `^12.42.2` | MIT | Motion primitives |

---

## 3. Accessibility / reduced-motion model

- OS `prefers-reduced-motion` via Motion `useReducedMotion`
- LifeOS `data-lifeos-reduced-motion` workspace toggle
- Overload `data-lifeos-overloaded` disables nonessential motion
- Board: Pointer + Touch + Keyboard sensors, drag handle, live announcements, status `<select>` alternative
- Map: keyboard node list, labels/shapes/status text (not color-only), mobile list fallback, no node editing/connect
- Feedback region: polite live announcements + dismissible cards; staged ≠ canonical saved

---

## 4. Command-map data model

Built only from vault-derived inputs:

- Projects (status, priority, business, next_action, blocker, waiting_on, owner)
- Businesses section notes
- People section notes
- Agents section notes
- System node `LifeOS`

Relationships are evidenced fields only (`belongs-to`, `blocks`, `waiting-on`, `owned-by`, `next-action`, `tracked-by`). No invented agent assignments.

---

## 5. Persistence boundaries

- Drag/status/priority/next-action edits **stage in browser only**
- Approval package remains `lifeos.change-plan.v1` / `proposal-only`
- Authenticated draft PR path unchanged
- Feedback copy must state browser-only vs canonical explicitly
- Interactive Ops V2 conflict hardening remains a required pre-write integration

---

## 6. Known limitations

- Command map is exploration/navigation — not an editor
- V2 persistence not yet merged into this line
- Voice/audio console still Phase 3 (no audio added in Visual V1)
- Rive presence still deferred
- Map layout is deterministic columns, not force-directed physics

---

## 7. Phased plan

See `docs/INTERACTIVE_IMPLEMENTATION_CHECKLIST.md`. Visual V1 covers Phase 1 motion foundation + Phase 2 command map (+ accessible dnd-kit board upgrade).
