# LifeOS Owner Acceptance Workbook

**Document type:** Printable owner acceptance workbook  
**Repository:** `ebyron357/LifeOS-Enterprise`  
**Governing status:** Agent closeout complete → owner acceptance required  
**Do not mark owner acceptance complete in this workbook on the owner's behalf.**

Use one row per test. Record evidence (screenshot, short note, or commit SHA). Separate agent-completed work from owner-required work.

---

## How to use

1. Deploy or open the PR preview for the closeout branch.
2. Complete every checkbox row.
3. Mark Pass / Fail.
4. Attach evidence.
5. Sign only after all owner-required rows pass.

---

## Section A — Agent-completed prerequisites (verify, do not re-implement)

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| A1 | Draft PR exists | Open the closeout draft PR | One draft PR contains widgets, game, voice, screen, approvals, tests, docs | ☐ | | |
| A2 | Automated tests green | Review CI / local test report in PR | Lint, typecheck, unit, build, vault audit, Playwright reported | ☐ | | |
| A3 | No secrets in repo | Spot-check `.env.example` and diff | Placeholders only; no live tokens | ☐ | | |
| A4 | Integrations truthful | Open `/conversation` Context/tools | Unconfigured tools shown unavailable with requirements | ☐ | | |

---

## Section B — Dashboard and widgets

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| B1 | Desktop hydrate @1440 | Open `/dashboard` at 1440px | Multi-column widgets visible; no uncaught console errors | ☐ | | |
| B2 | Laptop hydrate @1024 | Open `/dashboard` at 1024px | Layout usable; widgets visible | ☐ | | |
| B3 | Drag | Drag a widget by the ⋮⋮ handle | Coordinates change and persist after refresh | ☐ | | |
| B4 | Resize | Resize a widget from SE handle | Dimensions change and persist | ☐ | | |
| B5 | Minimize / restore | Minimize then Restore | Widget collapses and restores | ☐ | | |
| B6 | Show / hide | Widget Library → Hide then Show | Widget disappears/reappears and persists | ☐ | | |
| B7 | Accessible reorder | Widget Library → Move up/down | Order changes; keyboard operable | ☐ | | |
| B8 | Repair Layout | Click Repair layout | Invalid layout recovers to defaults with visible message if repaired | ☐ | | |
| B9 | Mobile @390 | Open dashboard at 390px | Stacked cards with Move up/down, Minimize, Hide — not a dead feed | ☐ | | |
| B10 | Reduced motion | Enable reduced motion preference | Motion respects preference; controls remain usable | ☐ | | |

---

## Section C — Verified game loop

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| C1 | Profile / avatar | Change alias and avatar | Profile updates; no XP invented | ☐ | | |
| C2 | Progress bar | Complete one attested quest | XP bar advances; level math matches XP | ☐ | | |
| C3 | Verified completion | Click Complete (attest) and confirm | XP awarded once | ☐ | | |
| C4 | Duplicate protection | Confirm complete again / refresh | No duplicate XP | ☐ | | |
| C5 | Cancel attestation | Click Complete then cancel dialog | No XP awarded | ☐ | | |
| C6 | Daily check-in | Click Daily check-in | +20 XP once per day; streak updates | ☐ | | |
| C7 | Boss / side / main quests | Inspect today's quests | Quests derive from active/blocked/waiting projects; boss battles show smaller actions | ☐ | | |
| C10 | Boss steps | Mark a boss step, then attest the battle | Step mark awards 0 XP; attested boss awards XP once | ☐ | | |
| C8 | End of day | Click End day results | Summary of completed quests appears | ☐ | | |
| C9 | Repair / reset | Repair then optionally Reset | Corrupted state recovers; reset clears progress intentionally | ☐ | | |

---

## Section D — Voice system

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| D1 | Voice settings | Open `/conversation` Voice settings | Provider, locale, input language, style, speed, pitch visible | ☐ | | |
| D2 | Preview / reset | Preview voice; Reset to default | Audible preview; defaults restore | ☐ | | |
| D3 | Persist prefs | Change settings; refresh | Settings restored from local storage | ☐ | | |
| D4 | Provider truth | With/without `OPENAI_API_KEY` | Unconfigured OpenAI not shown as available | ☐ | | |
| D5 | Start / stop | Start then Stop conversation | Listening starts/stops; no leftover capture | ☐ | | |
| D6 | Mute stops mic | Start conversation; Mute | Mic capture stops; transcripts stop submitting | ☐ | | |
| D7 | Unmute | Unmute | Listening resumes only after unmute | ☐ | | |
| D8 | Interrupt | Speak while assistant talking; Interrupt | Speech stops immediately; no overlap | ☐ | | |
| D9 | Push-to-talk | Use Push to talk | Works as fallback | ☐ | | |
| D10 | States visible | Observe UI during flow | listening / thinking / speaking / muted / stopped / error clear | ☐ | | |
| D11 | Mobile voice | Repeat D5–D8 at 390px | Controls usable on mobile | ☐ | | |

---

## Section E — Screen sharing safety

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| E1 | Share / stop | Share screen; Stop sharing | All tracks stop; indicator not active | ☐ | | |
| E2 | Browser end | End share from browser UI | App updates to ended; no false active state | ☐ | | |
| E3 | Navigate away | Share then leave `/conversation` | Tracks released on cleanup | ☐ | | |
| E4 | Deny permission | Deny share permission | Denied state; safe recovery | ☐ | | |

---

## Section F — Authorization, approvals, draft-PR-only writes

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| F1 | Approval gate | Ask Conversation to send Slack / stage change when configured | Pending approval required; no silent execute | ☐ | | |
| F2 | Reject | Reject approval | Nothing executes | ☐ | | |
| F3 | Forged approval | Attempt client-only approve without server record | Server rejects unknown/replayed/expired/wrong-project | ☐ | | |
| F4 | Change-plan draft PR | Stage a change plan with write config enabled in preview | Creates/updates **draft** PR only; never writes `main` | ☐ | | |
| F5 | Wrong project | Attempt write for mismatched project/path | Rejected server-side | ☐ | | |
| F6 | Failed write honesty | Force a failing write (bad token) | UI/API reports failure; no success claim | ☐ | | |

---

## Section G — Configuration and environment

| # | Check | Exact owner action | Expected result | Pass/Fail | Evidence | Notes |
|---|---|---|---|---|---|---|
| G1 | Copy env | Copy `.env.example` → local/Vercel | Placeholders only | ☐ | | |
| G2 | Write fail-closed | Leave write secrets empty | Writes disabled; no crash | ☐ | | |
| G3 | Optional voice | Leave OpenAI empty | Browser fallback; dashboard still loads | ☐ | | |
| G4 | Production origin | Set `LIFEOS_ALLOWED_ORIGIN` | Cross-origin denied | ☐ | | |

### Owner credential checklist (owner-only)

- [ ] GitHub fine-grained token → `LIFEOS_GITHUB_TOKEN`
- [ ] Write auth secret → `LIFEOS_WRITE_SECRET`
- [ ] Enable writes only when ready → `LIFEOS_WRITE_ENABLED=true`
- [ ] Allowed origin → `LIFEOS_ALLOWED_ORIGIN`
- [ ] Optional OpenAI TTS → `OPENAI_API_KEY`
- [ ] Voice session HMAC → `LIFEOS_VOICE_SESSION_SECRET`
- [ ] Optional tool tokens (ClickUp/Slack/n8n/Vercel) only if intentionally connecting

---

## Section H — Owner sign-off

| Field | Value |
|---|---|
| Preview / production URL | |
| Verified commit SHA | |
| Owner name | |
| Date | |
| Overall result | ☐ READY TO ACCEPT · ☐ BLOCKED · ☐ NOT READY |
| Blockers | |

**Rule:** Green CI alone is not acceptance. Live microphone, screen share, and write credentials must be verified by the owner on the candidate deployment.
